using Microsoft.EntityFrameworkCore;
using TerraMacetas.Api.Models;

namespace TerraMacetas.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ProductLine> ProductLines => Set<ProductLine>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<CompanyConfig> CompanyConfigs => Set<CompanyConfig>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<SiteVisit> SiteVisits => Set<SiteVisit>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ProductLine>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.HasMany(e => e.Products)
                  .WithOne(p => p.Line)
                  .HasForeignKey(p => p.LineId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasPrecision(18, 2);
        });

        modelBuilder.Entity<CompanyConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Total).HasPrecision(18, 2);
        });

        modelBuilder.Entity<SiteVisit>(entity =>
        {
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
        });
    }
}
