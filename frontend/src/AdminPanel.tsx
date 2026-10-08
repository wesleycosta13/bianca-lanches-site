import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Boxes, Check, ClipboardList, ImagePlus, LogOut, MessageCircle, Pencil, Plus, RefreshCw, Search, Settings, ShieldCheck, Trash2 } from "lucide-react";
import logoImage from "./img/LogoBianca.jpg";
import { formatPrice } from "./menu";

type ApiResponse<T> = { success: boolean; message: string; data: T | null };
type AuthResponse = { token: string; name: string; email: string; role: string; expiresAt: string };
type AdminUser = { id: string; name: string; email: string; role: string };
type BlockedLogin = { email: string; blockedAt: string; failedAttempts: number; ipAddresses: string[] };
type LoginAttempt = { id: number; email: string; ipAddress: string | null; numberOfAt: number; attemptedAt: string; clearedAt: string | null };
type OrderItem = { id: number; productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number };
type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryNeighborhood: string;
  deliveryComplement?: string | null;
  deliveryCity: string;
  deliveryReference?: string | null;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  changeFor?: number | null;
  notes?: string | null;
  items: OrderItem[];
  createdAt: string;
};
type Product = {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  price: number;
  variants: ProductVariant[];
  stockQuantity: number;
  imageUrl?: string | null;
  isAvailable: boolean;
};
type ProductVariant = { id: number; label: string; price: number; isAvailable: boolean };
type Category = { id: number; name: string; isActive: boolean };
type HeroImageConfig = { imageUrl: string };
type ProductVariantForm = { label: string; price: string; isAvailable: boolean };
type ProductForm = {
  name: string;
  description: string;
  categoryId: string;
  stockQuantity: string;
  imageUrl: string;
  isAvailable: boolean;
  variants: ProductVariantForm[];
};

type OrderStatus = { value: string; label: string; apiValue: number };
type OrderDateFilter = "today" | "yesterday" | "lastWeek" | "lastMonth" | "all";

const orderStatuses: OrderStatus[] = [
  { value: "Received", label: "Recebido", apiValue: 1 },
  { value: "InPreparation", label: "Em preparo", apiValue: 2 },
  { value: "Ready", label: "Pronto", apiValue: 3 },
  { value: "OutForDelivery", label: "Saiu para entrega", apiValue: 4 },
  { value: "Delivered", label: "Entregue", apiValue: 5 },
  { value: "Cancelled", label: "Cancelado", apiValue: 6 },
];

const emptyProductForm: ProductForm = {
  name: "",
  description: "",
  categoryId: "",
  stockQuantity: "0",
  imageUrl: "",
  isAvailable: true,
  variants: [{ label: "Unidade", price: "", isAvailable: true }],
};

async function apiRequest<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`/api${path}`, { ...init, headers });
  const result = await response.json().catch(() => null) as ApiResponse<T> | null;
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || "Não foi possível concluir a operação.");
  }
  return result.data as T;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

function formatPaymentMethod(method: string): string {
  return ({ Pix: "Pix", Cash: "Dinheiro", Card: "Cartão" } as Record<string, string>)[method] ?? method;
}

function getStatusMessageUrl(order: Order, status: string): string | null {
  const phone = order.customerPhone.replace(/\D/g, "");
  if (phone.length < 10) return null;

  const internationalPhone = phone.startsWith("55") ? phone : `55${phone}`;
  const message = status === "InPreparation"
    ? `Olá, ${order.customerName}! Seu pedido ${order.orderNumber} está em preparo. Avisaremos quando sair para entrega.`
    : `Olá, ${order.customerName}! Seu pedido ${order.orderNumber} saiu para entrega. Em breve chegará até você.`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

function matchesOrderDate(order: Order, filter: OrderDateFilter): boolean {
  if (filter === "all") return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date;

  if (filter === "today") {
    start = today;
    end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  } else if (filter === "yesterday") {
    end = today;
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  } else if (filter === "lastWeek") {
    const daysSinceMonday = (today.getDay() + 6) % 7;
    end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysSinceMonday);
    start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 7);
  } else {
    end = new Date(today.getFullYear(), today.getMonth(), 1);
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  }

  const createdAt = new Date(order.createdAt);
  return createdAt >= start && createdAt < end;
}

function AdminPanel() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("admin-token"));
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blockedLogins, setBlockedLogins] = useState<BlockedLogin[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [editingAttemptId, setEditingAttemptId] = useState<number | null>(null);
  const [editingCountValue, setEditingCountValue] = useState<number>(0);
  const [view, setView] = useState<"orders" | "products" | "security" | "settings">("orders");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [whatsAppLink, setWhatsAppLink] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [orderFilter, setOrderFilter] = useState("Todos");
  const [orderDateFilter, setOrderDateFilter] = useState<OrderDateFilter>("today");
  const [midnightRefresh, setMidnightRefresh] = useState(0);
  const [orderSearch, setOrderSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [savingHeroImage, setSavingHeroImage] = useState(false);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeout = window.setTimeout(() => {
      setOrderDateFilter("today");
      if (token) {
        apiRequest<Order[]>("/orders", token).then(setOrders).catch(() => undefined);
      }
      setMidnightRefresh(Date.now());
    }, nextMidnight.getTime() - now.getTime() + 25);
    return () => window.clearTimeout(timeout);
  }, [midnightRefresh, token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isCurrent = true;
    setLoading(true);
    Promise.all([
      apiRequest<AdminUser>("/auth/me", token),
      apiRequest<Order[]>("/orders", token),
      apiRequest<Product[]>("/products", token),
      apiRequest<Category[]>("/categories", token),
      apiRequest<BlockedLogin[]>("/auth/blocked-logins", token),
      apiRequest<LoginAttempt[]>("/auth/login-attempts", token),
      apiRequest<HeroImageConfig>("/config/hero-image", token),
    ]).then(([currentAdmin, loadedOrders, loadedProducts, loadedCategories, loadedBlockedLogins, loadedAttempts, loadedHeroImage]) => {
      if (currentAdmin.role !== "Admin") throw new Error("Esta conta não tem permissão de administrador.");
      if (!isCurrent) return;
      setAdmin(currentAdmin);
      setOrders(loadedOrders);
      setProducts(loadedProducts);
      setCategories(loadedCategories);
      setBlockedLogins(loadedBlockedLogins);
      setLoginAttempts(loadedAttempts);
      setHeroImageUrl(loadedHeroImage.imageUrl);
      setError("");
    }).catch((requestError: unknown) => {
      if (!isCurrent) return;
      sessionStorage.removeItem("admin-token");
      setToken(null);
      setAdmin(null);
      setLoginError(errorText(requestError));
    }).finally(() => {
      if (isCurrent) setLoading(false);
    });

    return () => { isCurrent = false; };
  }, [token]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const auth = await apiRequest<AuthResponse>("/auth/login", undefined, {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (auth.role !== "Admin") throw new Error("Esta conta não tem permissão de administrador.");
      sessionStorage.setItem("admin-token", auth.token);
      setToken(auth.token);
    } catch (requestError) {
      setLoginError(errorText(requestError));
      setLoading(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem("admin-token");
    setToken(null);
    setAdmin(null);
    setOrders([]);
    setProducts([]);
    setCategories([]);
    setLoginPassword("");
    setLoading(false);
  }

  async function refreshData() {
    if (!token) return;
    setRefreshing(true);
    setError("");
    try {
      const [loadedOrders, loadedProducts, loadedCategories] = await Promise.all([
        apiRequest<Order[]>("/orders", token),
        apiRequest<Product[]>("/products", token),
        apiRequest<Category[]>("/categories", token),
      ]);
      setOrders(loadedOrders);
      setProducts(loadedProducts);
      setCategories(loadedCategories);
      const loadedHeroImage = await apiRequest<HeroImageConfig>("/config/hero-image", token);
      setHeroImageUrl(loadedHeroImage.imageUrl);
      if (view === "security") {
        const [loadedBlocked, loadedAttempts] = await Promise.all([
          apiRequest<BlockedLogin[]>("/auth/blocked-logins", token),
          apiRequest<LoginAttempt[]>("/auth/login-attempts", token),
        ]);
        setBlockedLogins(loadedBlocked);
        setLoginAttempts(loadedAttempts);
      }
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setRefreshing(false);
    }
  }

  async function showBlockedLogins() {
    setView("security");
    if (!token) return;
    setRefreshing(true);
    setError("");
    try {
      const [loadedBlocked, loadedAttempts] = await Promise.all([
        apiRequest<BlockedLogin[]>("/auth/blocked-logins", token),
        apiRequest<LoginAttempt[]>("/auth/login-attempts", token),
      ]);
      setBlockedLogins(loadedBlocked);
      setLoginAttempts(loadedAttempts);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setRefreshing(false);
    }
  }

  async function unblockLogin(blockedLogin: BlockedLogin) {
    if (!token || !window.confirm(`Liberar o acesso para ${blockedLogin.email}?`)) return;
    setError("");
    setFeedback("");
    try {
      await apiRequest<unknown>(`/auth/blocked-logins?email=${encodeURIComponent(blockedLogin.email)}`, token, { method: "DELETE" });
      setBlockedLogins((current) => current.filter((entry) => entry.email !== blockedLogin.email));
      setFeedback(`Acesso liberado para ${blockedLogin.email}.`);
    } catch (requestError) {
      setError(errorText(requestError));
    }
  }

  async function updateAttemptCount(id: number, count: number) {
    if (!token) return;
    setError("");
    setFeedback("");
    try {
      const updated = await apiRequest<LoginAttempt>(`/auth/login-attempts/${id}`, token, {
        method: "PUT",
        body: JSON.stringify({ numberOfAt: count }),
      });
      setLoginAttempts((current) => current.map((item) => (item.id === id ? updated : item)));
      setEditingAttemptId(null);
      setFeedback(`Tentativas atualizadas para ${count}.`);
    } catch (requestError) {
      setError(errorText(requestError));
    }
  }

  async function updateOrderStatus(order: Order, status: string) {
    if (!token || order.status === status) return;
    const newStatus = orderStatuses.find((option) => option.value === status);
    if (!newStatus) return;
    const shouldNotifyCustomer = status === "InPreparation" || status === "OutForDelivery";
    const notificationWindow = shouldNotifyCustomer ? window.open("about:blank", "_blank") : null;
    setUpdatingOrderId(order.id);
    setError("");
    setFeedback("");
    setWhatsAppLink(null);
    try {
      const updated = await apiRequest<Order>(`/orders/${order.id}/status`, token, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus.apiValue }),
      });
      setOrders((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      if (shouldNotifyCustomer) {
        const messageUrl = getStatusMessageUrl(updated, status);
        if (!messageUrl) {
          notificationWindow?.close();
          setFeedback(`Pedido ${updated.orderNumber} atualizado, mas o telefone do cliente está incompleto.`);
        } else {
          setWhatsAppLink(messageUrl);
          setFeedback(`Pedido ${updated.orderNumber} atualizado. Revise a mensagem e envie pelo WhatsApp.`);
          if (notificationWindow) {
            notificationWindow.opener = null;
            notificationWindow.location.href = messageUrl;
          }
        }
      } else {
        notificationWindow?.close();
        setFeedback(`Pedido ${updated.orderNumber} atualizado.`);
      }
    } catch (requestError) {
      notificationWindow?.close();
      setError(errorText(requestError));
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function startNewProduct() {
    setEditingProductId(null);
    setProductForm({ ...emptyProductForm, categoryId: categories.find((category) => category.isActive)?.id.toString() ?? "" });
    setFeedback("");
    setError("");
  }

  function startEditingProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId.toString(),
      stockQuantity: product.stockQuantity.toString(),
      imageUrl: product.imageUrl ?? "",
      isAvailable: product.isAvailable,
      variants: product.variants.map((variant) => ({ label: variant.label, price: variant.price.toString(), isAvailable: variant.isAvailable })),
    });
    setFeedback("");
    setError("");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSavingProduct(true);
    setError("");
    setFeedback("");
    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      categoryId: Number(productForm.categoryId),
      stockQuantity: Number(productForm.stockQuantity),
      imageUrl: productForm.imageUrl.trim() || null,
      isAvailable: productForm.isAvailable,
      variants: productForm.variants.map((variant) => ({ label: variant.label.trim(), price: Number(variant.price), isAvailable: variant.isAvailable })),
    };
    try {
      const route = editingProductId === null ? "/products" : `/products/${editingProductId}`;
      const saved = await apiRequest<Product>(route, token, {
        method: editingProductId === null ? "POST" : "PUT",
        body: JSON.stringify(payload),
      });
      setProducts((current) => editingProductId === null
        ? [saved, ...current]
        : current.map((product) => product.id === saved.id ? saved : product));
      setFeedback(editingProductId === null ? "Produto cadastrado com sucesso." : "Produto atualizado com sucesso.");
      setEditingProductId(null);
      setProductForm(emptyProductForm);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setSavingProduct(false);
    }
  }

  async function saveHeroImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSavingHeroImage(true);
    setError("");
    setFeedback("");
    try {
      const saved = await apiRequest<HeroImageConfig>("/config/hero-image", token, {
        method: "PUT",
        body: JSON.stringify({ imageUrl: heroImageUrl.trim() }),
      });
      setHeroImageUrl(saved.imageUrl);
      setFeedback("Imagem principal atualizada com sucesso.");
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setSavingHeroImage(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!token || !window.confirm(`Excluir o produto ${product.name}?`)) return;
    setError("");
    setFeedback("");
    try {
      await apiRequest<unknown>(`/products/${product.id}`, token, { method: "DELETE" });
      setProducts((current) => current.filter((entry) => entry.id !== product.id));
      if (editingProductId === product.id) startNewProduct();
      setFeedback("Produto excluído.");
    } catch (requestError) {
      setError(errorText(requestError));
    }
  }

  const visibleOrders = orders.filter((order) => {
    const matchesDate = matchesOrderDate(order, orderDateFilter);
    const matchesFilter = orderFilter === "Todos" || order.status === orderFilter;
    const query = orderSearch.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !query || `${order.orderNumber} ${order.customerName} ${order.customerPhone}`.toLocaleLowerCase("pt-BR").includes(query);
    return matchesDate && matchesFilter && matchesSearch;
  });

  if (loading) {
    return <main className="admin-loading" aria-live="polite"><span className="admin-spinner" />Verificando acesso administrativo...</main>;
  }

  if (!token || !admin) {
    return (
      <main className="admin-login-page">
        <a className="admin-back-link" href="/"><ArrowLeft size={16} /> Voltar para a loja</a>
        <section className="admin-login-panel">
          <span className="admin-login-mark"><ShieldCheck size={24} /></span>
          <p className="admin-eyebrow">Área restrita</p>
          <h1>Acesso administrativo</h1>
          <p className="admin-login-copy">Entre com a conta de administrador da loja.</p>
          <form onSubmit={signIn} className="admin-form">
            <label className="admin-field">E-mail<input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} autoComplete="username" required /></label>
            <label className="admin-field">Senha<input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} autoComplete="current-password" required /></label>
            {loginError && <p className="admin-error" role="alert">{loginError}</p>}
            <button className="admin-primary-button" type="submit"><span>Entrar</span><ArrowRight size={17} /></button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a className="admin-brand" href="/" aria-label="Voltar à Bianca Lanches"><span><img src={logoImage} alt="" className="admin-brand-logo" /></span><strong>BIANCA <small>ADMIN</small></strong></a>
        <div className="admin-account"><span><strong>{admin.name}</strong><small></small></span><button className="admin-icon-button" onClick={signOut} aria-label="Sair" title="Sair"><LogOut size={17} /></button></div>
      </header>

      <section className="admin-content">
        <div className="admin-title-row">
          <div><p className="admin-eyebrow">Operação da loja</p><h1>{view === "orders" ? "Pedidos" : view === "products" ? "Produtos" : view === "settings" ? "Configurações" : "Segurança"}</h1><p className="admin-subtitle">{view === "orders" ? `${visibleOrders.length} de ${orders.length} pedidos` : view === "products" ? `${products.length} produtos cadastrados` : view === "settings" ? "Personalize a página inicial" : `${blockedLogins.length} acessos bloqueados`}</p></div>
          <button className="admin-secondary-button" onClick={refreshData} disabled={refreshing} aria-label="Atualizar dados"><RefreshCw size={16} className={refreshing ? "admin-spinning" : ""} /><span>Atualizar</span></button>
        </div>

        <nav className="admin-tabs" aria-label="Seções administrativas">
          <button className={view === "orders" ? "active" : ""} onClick={() => setView("orders")}><ClipboardList size={17} />Pedidos<span>{orders.length}</span></button>
          <button className={view === "products" ? "active" : ""} onClick={() => setView("products")}><Boxes size={17} />Produtos<span>{products.length}</span></button>
          <button className={view === "security" ? "active" : ""} onClick={showBlockedLogins}><ShieldCheck size={17} />Segurança<span>{blockedLogins.length}</span></button>
          <button className={view === "settings" ? "active" : ""} onClick={() => { setView("settings"); setError(""); setFeedback(""); }}><Settings size={17} />Configurações</button>
        </nav>

        {error && <p className="admin-error admin-notice" role="alert">{error}</p>}
        {feedback && <p className="admin-success admin-notice" role="status"><Check size={15} />{feedback}</p>}
        {whatsAppLink && <a className="admin-whatsapp-link" href={whatsAppLink} target="_blank" rel="noreferrer"><MessageCircle size={16} />Abrir mensagem no WhatsApp</a>}

        {view === "orders" ? (
          <section className="admin-workspace" aria-label="Gestão de pedidos">
            <div className="admin-toolbar">
              <label className="admin-search"><Search size={16} /><input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Buscar pedido, cliente ou telefone" aria-label="Buscar pedidos" /></label>
              <div className="admin-filter-group">
                <label className="admin-filter">Período<select value={orderDateFilter} onChange={(event) => setOrderDateFilter(event.target.value as OrderDateFilter)}><option value="today">Hoje</option><option value="yesterday">Ontem</option><option value="lastWeek">Semana passada</option><option value="lastMonth">Mês passado</option><option value="all">Todo o histórico</option></select></label>
                <label className="admin-filter">Status<select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}><option>Todos</option>{orderStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              </div>
            </div>
            {visibleOrders.length ? <div className="admin-order-list">
              {visibleOrders.map((order) => <article className="admin-order-row" key={order.id}>
                <div className="admin-order-main">
                  <div className="admin-order-heading"><strong>{order.orderNumber}</strong><time>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(order.createdAt))}</time></div>
                  <h2>{order.customerName}</h2>
                  <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                  <p>{order.deliveryStreet}, {order.deliveryNumber} · {order.deliveryNeighborhood}{order.deliveryComplement ? ` · ${order.deliveryComplement}` : ""}, {order.deliveryCity}</p>
                  {order.deliveryReference && <p className="admin-order-reference">Referência: {order.deliveryReference}</p>}
                  <ul>{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.productName} <span>{formatPrice(item.subtotal)}</span></li>)}</ul>
                </div>
                <div className="admin-order-total"><span>{formatPaymentMethod(order.paymentMethod)}</span><strong>{formatPrice(order.totalAmount)}</strong>{order.changeFor && <small>Troco para {formatPrice(order.changeFor)}</small>}</div>
                <label className="admin-status-field">Status<select className={`admin-status-select status-${order.status.toLowerCase()}`} value={order.status} onChange={(event) => updateOrderStatus(order, event.target.value)} disabled={updatingOrderId === order.id}>{orderStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              </article>)}
            </div> : <div className="admin-empty"><ClipboardList size={26} /><strong>Nenhum pedido encontrado</strong><span>Altere o período ou os filtros para consultar outros pedidos.</span></div>}
          </section>
        ) : view === "products" ? (
          <section className="admin-product-layout" aria-label="Gestão de produtos">
            <div className="admin-product-list">
              <div className="admin-list-heading"><div><h2>Catálogo</h2><span>{products.length} produtos</span></div><button className="admin-primary-button admin-add-button" onClick={startNewProduct}><Plus size={16} />Novo produto</button></div>
              {products.length ? products.map((product) => <article className={`admin-product-row ${editingProductId === product.id ? "selected" : ""}`} key={product.id}>
                <div className="admin-product-thumb">{product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <ImagePlus size={20} />}</div>
                <div className="admin-product-copy"><strong>{product.name}</strong><span>{product.categoryName} · {formatPrice(product.price)}</span><small>{product.isAvailable ? "Disponível" : "Indisponível"} · estoque {product.stockQuantity}</small></div>
                <button className="admin-icon-button" onClick={() => startEditingProduct(product)} aria-label={`Editar ${product.name}`} title="Editar"><Pencil size={16} /></button>
                <button className="admin-icon-button admin-delete-button" onClick={() => deleteProduct(product)} aria-label={`Excluir ${product.name}`} title="Excluir"><Trash2 size={16} /></button>
              </article>) : <div className="admin-empty"><Boxes size={25} /><strong>Seu catálogo está vazio</strong><span>Cadastre o primeiro produto para começar.</span></div>}
            </div>

            <form className="admin-product-form" onSubmit={saveProduct}>
              <div className="admin-form-heading"><span className="admin-eyebrow">{editingProductId === null ? "Novo item" : `Produto #${editingProductId}`}</span><h2>{editingProductId === null ? "Cadastrar produto" : "Editar produto"}</h2></div>
              <label className="admin-field">Nome do produto<input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} maxLength={150} required /></label>
              <label className="admin-field">Descrição<textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} maxLength={500} rows={3} /></label>
              <label className="admin-field">Categoria<select value={productForm.categoryId} onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))} required><option value="" disabled>Selecione</option>{categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <fieldset className="admin-variants-field">
                <legend>Variações e preços</legend>
                {productForm.variants.map((variant, index) => <div className="admin-variant-row" key={index}>
                  <label className="admin-field">Nome<input value={variant.label} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry) }))} maxLength={50} required /></label>
                  <label className="admin-field">Preço (R$)<input type="number" min="0.01" step="0.01" value={variant.price} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((entry, entryIndex) => entryIndex === index ? { ...entry, price: event.target.value } : entry) }))} required /></label>
                  <label className="admin-variant-available"><input type="checkbox" checked={variant.isAvailable} onChange={(event) => setProductForm((current) => ({ ...current, variants: current.variants.map((entry, entryIndex) => entryIndex === index ? { ...entry, isAvailable: event.target.checked } : entry) }))} />Ativa</label>
                  <button className="admin-icon-button admin-delete-button" type="button" aria-label={`Remover variação ${variant.label}`} disabled={productForm.variants.length === 1} onClick={() => setProductForm((current) => ({ ...current, variants: current.variants.filter((_, entryIndex) => entryIndex !== index) }))}><Trash2 size={15} /></button>
                </div>)}
                <button className="admin-secondary-button admin-add-variant" type="button" onClick={() => setProductForm((current) => ({ ...current, variants: [...current.variants, { label: "", price: "", isAvailable: true }] }))}><Plus size={15} />Adicionar variação</button>
              </fieldset>
              <label className="admin-field">Estoque<input type="number" min="0" step="1" value={productForm.stockQuantity} onChange={(event) => setProductForm((current) => ({ ...current, stockQuantity: event.target.value }))} required /></label>
              <label className="admin-field">Imagem (URL)<input type="url" value={productForm.imageUrl} onChange={(event) => setProductForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." /></label>
              {productForm.imageUrl && <div className="admin-image-preview"><img src={productForm.imageUrl} alt="Prévia da imagem do produto" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /></div>}
              <label className="admin-checkbox"><input type="checkbox" checked={productForm.isAvailable} onChange={(event) => setProductForm((current) => ({ ...current, isAvailable: event.target.checked }))} />Produto disponível para venda</label>
              <div className="admin-form-actions"><button type="submit" className="admin-primary-button" disabled={savingProduct}><span>{savingProduct ? "Salvando..." : editingProductId === null ? "Cadastrar produto" : "Salvar alterações"}</span><ArrowRight size={16} /></button>{editingProductId !== null && <button type="button" className="admin-secondary-button" onClick={startNewProduct}>Cancelar</button>}</div>
            </form>
          </section>
        ) : view === "settings" ? (
          <section className="admin-settings-workspace" aria-label="Configurações da loja">
            <form className="admin-settings-form" onSubmit={saveHeroImage}>
              <div className="admin-form-heading"><span className="admin-eyebrow">Página inicial</span><h2>Imagem principal</h2></div>
              <p className="admin-settings-copy">Altere a foto grande exibida na primeira seção do site. Cole o endereço HTTPS direto da imagem.</p>
              <label className="admin-field">URL da imagem<input type="url" value={heroImageUrl} onChange={(event) => setHeroImageUrl(event.target.value)} placeholder="https://exemplo.com/imagem.jpg" maxLength={2048} required /></label>
              {heroImageUrl && <div className="admin-image-preview admin-hero-image-preview"><img src={heroImageUrl} alt="Prévia da imagem principal" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /></div>}
              <button type="submit" className="admin-primary-button" disabled={savingHeroImage}><span>{savingHeroImage ? "Salvando..." : "Salvar imagem"}</span><ArrowRight size={16} /></button>
            </form>
          </section>
        ) : (
          <section className="admin-workspace" aria-label="Acessos administrativos bloqueados">
            <div className="admin-list-heading">
              <div><h2>Acessos bloqueados</h2><span>Bloqueio permanente após 5 falhas em 15 minutos</span></div>
            </div>
            {blockedLogins.length ? <div className="admin-order-list">
              {blockedLogins.map((blockedLogin) => <article className="admin-order-row" key={blockedLogin.email}>
                <div className="admin-order-main">
                  <div className="admin-order-heading"><strong>{blockedLogin.email}</strong><time>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(blockedLogin.blockedAt))}</time></div>
                  <p>{blockedLogin.failedAttempts} tentativas inválidas</p>
                  <p>IP(s): {blockedLogin.ipAddresses.length ? blockedLogin.ipAddresses.join(", ") : "Não identificado"}</p>
                </div>
                <button className="admin-secondary-button" onClick={() => unblockLogin(blockedLogin)}>Liberar acesso</button>
              </article>)}
            </div> : <div className="admin-empty"><ShieldCheck size={25} /><strong>Nenhum acesso bloqueado</strong><span>Os bloqueios permanentes aparecerão aqui.</span></div>}

            <div className="admin-list-heading" style={{ marginTop: "2rem" }}>
              <div><h2>Monitoramento de IPs e Tentativas</h2><span>Registros atualizados por IP (máx. 5 tentativas em 15 min)</span></div>
            </div>
            {loginAttempts.length ? <div className="admin-order-list">
              {loginAttempts.map((attempt) => (
                <article className="admin-order-row" key={attempt.id}>
                  <div className="admin-order-main">
                    <div className="admin-order-heading">
                      <strong>IP: {attempt.ipAddress || "Não identificado"}</strong>
                      <time>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(attempt.attemptedAt))}</time>
                    </div>
                    <p>Último e-mail: <strong>{attempt.email}</strong></p>
                    <p>Tentativas consecutivas: <strong style={{ color: attempt.numberOfAt >= 5 ? "#e53e3e" : "inherit" }}>{attempt.numberOfAt} / 5</strong> {attempt.clearedAt && <small style={{ color: "#38a169" }}>(Resetado)</small>}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {editingAttemptId === attempt.id ? (
                      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          style={{ width: "60px", padding: "0.4rem" }}
                          value={editingCountValue}
                          onChange={(e) => setEditingCountValue(Number(e.target.value))}
                        />
                        <button className="admin-primary-button" style={{ padding: "0.4rem 0.8rem" }} onClick={() => updateAttemptCount(attempt.id, editingCountValue)}>Salvar</button>
                        <button className="admin-secondary-button" style={{ padding: "0.4rem 0.8rem" }} onClick={() => setEditingAttemptId(null)}>Cancelar</button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="admin-secondary-button"
                          onClick={() => {
                            setEditingAttemptId(attempt.id);
                            setEditingCountValue(attempt.numberOfAt);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="admin-secondary-button"
                          style={{ color: "#38a169", borderColor: "#38a169" }}
                          onClick={() => updateAttemptCount(attempt.id, 0)}
                          title="Zerar o contador para liberar o IP"
                        >
                          Zerar (0)
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div> : <div className="admin-empty"><ShieldCheck size={25} /><strong>Nenhuma tentativa registrada</strong><span>As tentativas de acesso serão listadas e atualizadas aqui por IP.</span></div>}
          </section>
        )}

        <footer className="admin-footer"><ShieldCheck size={15} /> Sessão administrativa protegida <a href="/">Voltar à loja</a></footer>
      </section>
    </main>
  );
}

export default AdminPanel;
