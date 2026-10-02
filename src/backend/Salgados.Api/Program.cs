using System.Net;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Npgsql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Salgados.Api.Middlewares;
using Salgados.Api.Services;
using Salgados.Infrastructure.Data;

var envDirectory = new DirectoryInfo(Directory.GetCurrentDirectory());
while (envDirectory is not null && !File.Exists(Path.Combine(envDirectory.FullName, ".env")))
    envDirectory = envDirectory.Parent;
if (envDirectory is not null)
    DotNetEnv.Env.NoClobber().Load(Path.Combine(envDirectory.FullName, ".env"));

var builder = WebApplication.CreateBuilder(args);

// DbContext com PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    var user = builder.Configuration["POSTGRES_USER"];
    var password = builder.Configuration["POSTGRES_PASSWORD"];
    var database = builder.Configuration["POSTGRES_DB"];
    if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(database))
        throw new InvalidOperationException("Configure POSTGRES_USER, POSTGRES_PASSWORD e POSTGRES_DB no .env ou no ambiente.");

    connectionString = new NpgsqlConnectionStringBuilder
    {
        Host = builder.Configuration["POSTGRES_HOST"] ?? "localhost",
        Port = int.TryParse(builder.Configuration["POSTGRES_HOST_PORT"], out var databasePort) ? databasePort : 5433,
        Database = database,
        Username = user,
        Password = password
    }.ConnectionString;
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Injeção de Dependências dos Serviços da Aplicação
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IStockService, StockService>();

// Controllers
builder.Services.AddControllers();

// Configuração de CORS para permitir acesso do React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Autenticação JWT
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException("Jwt:Secret precisa ser configurada com pelo menos 32 bytes.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SalgadosApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SalgadosApp";
var adminEmail = builder.Configuration["Admin:Email"];
var adminPassword = builder.Configuration["Admin:Password"];
if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword) || adminPassword.Length < 12)
    throw new InvalidOperationException("Configure Admin:Email e Admin:Password com pelo menos 12 caracteres em armazenamento seguro.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Lê o IP real do cliente a partir dos headers repassados pelo nginx
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
    // Confia em qualquer proxy na rede interna do Docker
    options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse("172.16.0.0"), 12));
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("public-orders", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("authentication", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(15),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});

// Swagger com suporte a Bearer Token
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Lanchonete da Mãe API",
        Version = "v1",
        Description = "API REST para gerenciamento de vendas, estoque e pedidos de salgados."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Insira o token JWT desta forma: Bearer {seu_token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Middleware Global de Tratamento de Exceções
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// Corrige compatibilidade entre Microsoft.OpenApi (3.0.4) e SwaggerUI (espera <= 3.0.3)
app.Use(async (context, next) =>
{
    if (context.Request.Path.Value?.EndsWith("swagger.json") == true)
    {
        var originalBody = context.Response.Body;
        using var memStream = new MemoryStream();
        context.Response.Body = memStream;

        await next();

        memStream.Position = 0;
        var json = await new StreamReader(memStream).ReadToEndAsync();
        json = json.Replace("\"openapi\": \"3.0.4\"", "\"openapi\": \"3.0.1\"");

        context.Response.Body = originalBody;
        context.Response.Headers.ContentLength = Encoding.UTF8.GetByteCount(json);
        await context.Response.WriteAsync(json);
        return;
    }

    await next();
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lanchonete da Mãe API v1");
        c.RoutePrefix = "swagger";
    });

    app.MapGet("/", () => Results.Redirect("/swagger"));
    app.UseHttpsRedirection();
}

app.UseForwardedHeaders();
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed automático do banco de dados (se o banco estiver disponível)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
            await DatabaseSeeder.SeedAsync(context, adminEmail, adminPassword);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Aviso: Não foi possível aplicar migrações automáticas no startup (banco pode estar offline).");
    }
}

app.Run();

// Necessário para testes de integração com WebApplicationFactory
public partial class Program { }
