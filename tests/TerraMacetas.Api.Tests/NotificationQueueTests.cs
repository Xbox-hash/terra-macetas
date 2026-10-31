using TerraMacetas.Api.Services;

namespace TerraMacetas.Api.Tests;

public class NotificationQueueTests
{
    [Fact]
    public void No_encola_dos_reenvios_a_la_vez()
    {
        var queue = new NotificationQueue();

        Assert.True(queue.EnqueueResendPending());
        Assert.False(queue.EnqueueResendPending()); // ya hay uno pendiente

        queue.MarkResendFinished();
        Assert.True(queue.EnqueueResendPending()); // terminado el anterior, se puede volver a encolar
    }

    [Fact]
    public async Task Los_pedidos_salen_en_el_orden_en_que_entraron()
    {
        var queue = new NotificationQueue();
        queue.EnqueueOrderCreated("ORD-1");
        queue.EnqueueOrderCreated("ORD-2");

        var first = await queue.Reader.ReadAsync();
        var second = await queue.Reader.ReadAsync();

        Assert.Equal(new NotifyOrderCreated("ORD-1"), first);
        Assert.Equal(new NotifyOrderCreated("ORD-2"), second);
    }
}
