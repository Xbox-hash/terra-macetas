using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Threading.Channels;
using TerraMacetas.Api.Data;
using TerraMacetas.Api.DTOs;
using TerraMacetas.Api.Options;

namespace TerraMacetas.Api.Services;

public abstract record NotificationJob;
public record NotifyOrderCreated(string OrderId) : NotificationJob;
public record ResendPendingOrders : NotificationJob;

public interface INotificationQueue
{
    /// <summary>Encola el aviso de un pedido nuevo. Devuelve false si la cola está llena.</summary>
    bool EnqueueOrderCreated(string orderId);

    /// <summary>Encola un reenvío de pendientes, solo si no hay otro ya encolado o en curso.</summary>
    bool EnqueueResendPending();

    ChannelReader<NotificationJob> Reader { get; }
    void MarkResendFinished();
}

public class NotificationQueue : INotificationQueue
{
    private readonly Channel<NotificationJob> _channel = Channel.CreateBounded<NotificationJob>(
        new BoundedChannelOptions(500) { FullMode = BoundedChannelFullMode.Wait, SingleReader = true });

    private int _resendQueued;

    public ChannelReader<NotificationJob> Reader => _channel.Reader;

    public bool EnqueueOrderCreated(string orderId) => _channel.Writer.TryWrite(new NotifyOrderCreated(orderId));

    public bool EnqueueResendPending()
    {
        // Evita encolar un reenvío por cada consulta de estado del panel (antes era un bool static con carrera)
        if (Interlocked.CompareExchange(ref _resendQueued, 1, 0) != 0) return false;

        if (_channel.Writer.TryWrite(new ResendPendingOrders())) return true;

        Interlocked.Exchange(ref _resendQueued, 0);
        return false;
    }

    public void MarkResendFinished() => Interlocked.Exchange(ref _resendQueued, 0);
}

/// <summary>Procesa la cola de notificaciones de a un trabajo por vez.</summary>
public class NotificationWorker : BackgroundService
{
    private readonly INotificationQueue _queue;
    private readonly IWhatsAppNotificationService _whatsApp;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationWorker> _logger;

    public NotificationWorker(
        INotificationQueue queue,
        IWhatsAppNotificationService whatsApp,
        IServiceScopeFactory scopeFactory,
        ILogger<NotificationWorker> logger)
    {
        _queue = queue;
        _whatsApp = whatsApp;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var job in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                switch (job)
                {
                    case NotifyOrderCreated created:
                        await NotifyOrderAsync(created.OrderId, stoppingToken);
                        break;
                    case ResendPendingOrders:
                        await _whatsApp.ResendPendingOrdersAsync();
                        break;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Fallo al procesar la notificación {Job}", job);
            }
            finally
            {
                if (job is ResendPendingOrders) _queue.MarkResendFinished();
            }
        }
    }

    private async Task NotifyOrderAsync(string orderId, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var order = await db.Orders.FindAsync(new object[] { orderId }, ct);
        if (order is null || order.WhatsAppNotified) return;

        var items = JsonSerializer.Deserialize<List<OrderItemDto>>(order.ItemsJson) ?? new List<OrderItemDto>();
        await _whatsApp.SendOrderNotificationAsync(order, EvolutionWhatsAppService.BuildItemsSummary(items));
    }
}
public class PendingNotificationsScheduler : BackgroundService
{
    private readonly INotificationQueue _queue;
    private readonly TimeSpan _interval;

    public PendingNotificationsScheduler(INotificationQueue queue, IOptions<WhatsAppOptions> options)
    {
        _queue = queue;
        _interval = TimeSpan.FromMinutes(Math.Max(1, options.Value.ResendIntervalMinutes));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);
        do
        {
            _queue.EnqueueResendPending();
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}