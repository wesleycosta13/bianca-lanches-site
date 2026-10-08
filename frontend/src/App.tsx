import { useDeferredValue, useEffect, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowRight, Check, Clock3, MapPin, Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import logoImage from "./img/LogoBianca.jpg";
import { categories, formatPrice, menuItems, type MenuItem } from "./menu";

const defaultHeroImageUrl = "https://i.pinimg.com/736x/7d/ac/8b/7dac8bdfec19eecf52b3e237165a753e.jpg";

type CartLine = { itemId: string; variantId: string; quantity: number };
type PaymentMethod = "Pix" | "Dinheiro" | "Cartão" | "";
type CatalogProductVariant = { id: number; label: string; price: number; isAvailable: boolean };
type CatalogProduct = { id: number; name: string; description: string; price: number; imageUrl?: string | null; categoryName: string; isAvailable: boolean; variants: CatalogProductVariant[] };

type CheckoutDetailsProps = {
  neighborhood: string;
  onNeighborhoodChange: (neighborhood: string) => void;
  street: string;
  onStreetChange: (street: string) => void;
  number: string;
  onNumberChange: (number: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void;
  onCheckout: () => void;
};

function CheckoutDetails({ neighborhood, onNeighborhoodChange, street, onStreetChange, number, onNumberChange, paymentMethod, onPaymentMethodChange, onCheckout }: CheckoutDetailsProps) {
  const readyToCheckout = neighborhood.trim().length > 0 && street.trim().length > 0 && paymentMethod !== "";

  return (
    <>
      <div className="checkout-details">
        <label className="checkout-field">
          Bairro
          <input value={neighborhood} onChange={(event) => onNeighborhoodChange(event.target.value)} placeholder="Seu bairro" autoComplete="address-level3" required />
        </label>
        <label className="checkout-field">
          Rua
          <input value={street} onChange={(event) => onStreetChange(event.target.value)} placeholder="Nome da rua" autoComplete="address-line1" required />
        </label>
        <label className="checkout-field">
          Número (opcional)
          <input value={number} onChange={(event) => onNumberChange(event.target.value)} placeholder="Número da residência" inputMode="numeric" />
        </label>
        <label className="checkout-field">
          Forma de pagamento
          <select value={paymentMethod} onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)} required>
            <option value="" disabled>Selecione uma opção</option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão">Cartão</option>
          </select>
        </label>
      </div>
      {readyToCheckout && <button className="checkout-button" onClick={onCheckout}><span>Fechar pedido</span><ArrowRight size={17} /></button>}
      <p className="checkout-caption">Confira os dados antes de enviar seu pedido.</p>
    </>
  );
}

function formatWhatsAppNumber(phoneNumber: string) {
  const localNumber = phoneNumber.replace(/\D/g, "").slice(-11);
  if (localNumber.length !== 11) return localNumber;
  return `${localNumber.slice(0, 2)} ${localNumber.slice(2, 7)}-${localNumber.slice(7)}`;
}

function App() {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState(defaultHeroImageUrl);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState("");
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");

  useEffect(() => {
    let isCurrent = true;

    fetch("/api/config/whatsapp-contact")
      .then(async (response) => {
        if (response.status === 204) return "";
        if (!response.ok) throw new Error(`Falha ao carregar contato: HTTP ${response.status}`);
        const result = await response.json() as { success: boolean; message: string; data: { phoneNumber: string } | null };
        if (!result.success) throw new Error(result.message);
        return result.data?.phoneNumber ?? "";
      })
      .then((phoneNumber) => {
        if (isCurrent) setWhatsappNumber(phoneNumber.replace(/\D/g, ""));
      })
      .catch((error: unknown) => {
        if (isCurrent) console.error("Não foi possível carregar o contato do WhatsApp da loja.", error);
      });

    fetch("/api/config/hero-image")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Falha ao carregar imagem principal: HTTP ${response.status}`);
        const result = await response.json() as { success: boolean; message: string; data: { imageUrl: string } | null };
        if (!result.success || !result.data?.imageUrl) throw new Error(result.message || "Configuração da imagem principal inválida.");
        return result.data.imageUrl;
      })
      .then((imageUrl) => {
        if (isCurrent) setHeroImageUrl(imageUrl);
      })
      .catch((error: unknown) => {
        if (isCurrent) console.error("Não foi possível carregar a imagem principal configurada.", error);
      });

    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) return [];
        const result = await response.json() as { success: boolean; data: CatalogProduct[] | null };
        return result.success ? result.data ?? [] : [];
      })
      .then((products) => {
        if (isCurrent) setCatalogProducts(products);
      })
      .catch(() => undefined);

    return () => { isCurrent = false; };
  }, []);

  const productsByName = new Map(catalogProducts.map((product) => [product.name.trim().toLocaleLowerCase("pt-BR"), product]));
  const knownItems = menuItems
    .map((item) => {
      const product = productsByName.get(item.name.trim().toLocaleLowerCase("pt-BR"));
      return product ? {
        ...item,
        description: product.description || item.description,
        image: product.imageUrl || item.image,
        isAvailable: product.isAvailable,
        variants: product.variants.map((variant) => ({ id: String(variant.id), label: variant.label, price: variant.isAvailable ? variant.price : null })),
      } : { ...item, isAvailable: true };
    })
    .filter((item) => item.isAvailable);
  const knownNames = new Set(menuItems.map((item) => item.name.trim().toLocaleLowerCase("pt-BR")));
  const additionalItems: MenuItem[] = catalogProducts
    .filter((product) => product.isAvailable && !knownNames.has(product.name.trim().toLocaleLowerCase("pt-BR")))
    .map((product) => ({
      id: `product-${product.id}`,
      name: product.name,
      category: product.categoryName.toLocaleLowerCase("pt-BR").includes("bebida") ? "Bebidas" : "Salgados variados",
      description: product.description,
      image: product.imageUrl ?? "",
      imageAlt: product.name,
      variants: product.variants.map((variant) => ({
        id: String(variant.id),
        label: variant.label,
        price: variant.isAvailable ? variant.price : null,
      })),
    }));
  const currentMenuItems = [...knownItems, ...additionalItems];

  const filteredItems = currentMenuItems.filter((item) =>
    `${item.name} ${item.description}`.toLocaleLowerCase("pt-BR").includes(deferredSearch.toLocaleLowerCase("pt-BR")),
  );
  const categorySections = categories
    .filter((category) => category !== "Todos")
    .filter((category) => selectedCategory === "Todos" || selectedCategory === category)
    .map((category) => ({ category, items: filteredItems.filter((item) => item.category === category) }))
    .filter((section) => section.items.length > 0);

  useEffect(() => {
    function updateActiveCategory() {
      const menu = document.getElementById("cardapio");
      if (!menu || menu.getBoundingClientRect().top > window.innerHeight * 0.35) {
        setActiveCategory("Todos");
        return;
      }

      const marker = window.innerHeight * 0.35;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-menu-category]"));
      const sectionsAboveMarker = sections.filter((section) => section.getBoundingClientRect().top <= marker);
      const currentSection = sectionsAboveMarker[sectionsAboveMarker.length - 1];
      setActiveCategory(currentSection?.dataset.menuCategory ?? "Todos");
    }

    updateActiveCategory();
    window.addEventListener("scroll", updateActiveCategory, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveCategory);
  }, [deferredSearch]);

  const cartItems = cart.flatMap((line) => {
    const item = currentMenuItems.find((entry) => entry.id === line.itemId);
    const variant = item?.variants.find((entry) => entry.id === line.variantId);
    return item && variant?.price !== null && variant ? [{ ...line, item, variant, subtotal: variant.price * line.quantity }] : [];
  });
  const cartCount = cartItems.reduce((count, line) => count + line.quantity, 0);
  const cartTotal = cartItems.reduce((total, line) => total + line.subtotal, 0);

  function addToCart(item: MenuItem) {
    const variantId = selectedVariants[item.id] ?? item.variants.find((variant) => variant.price !== null)?.id;
    const variant = item.variants.find((entry) => entry.id === variantId);
    if (!variant || variant.price === null) return;

    setCart((current) => {
      const existing = current.find((line) => line.itemId === item.id && line.variantId === variant.id);
      if (existing) return current.map((line) => line === existing ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { itemId: item.id, variantId: variant.id, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function changeQuantity(itemId: string, variantId: string, amount: number) {
    setCart((current) => current
      .map((line) => line.itemId === itemId && line.variantId === variantId ? { ...line, quantity: line.quantity + amount } : line)
      .filter((line) => line.quantity > 0));
  }

  function checkout() {
    if (!cartCount || !deliveryNeighborhood.trim() || !deliveryStreet.trim() || !paymentMethod) return;
    setConfirmationError("");
    setConfirmedOrderNumber("");
    setConfirmationOpen(true);
  }

  async function confirmOrder() {
    if (!customerName.trim() || !customerPhone.trim() || !deliveryCity.trim() || !paymentMethod) {
      setConfirmationError("Preencha seu nome, telefone e cidade para continuar.");
      return;
    }

    const orderItems = cartItems.map((line) => {
      const product = productsByName.get(line.item.name.trim().toLocaleLowerCase("pt-BR"));
      const variantId = Number(line.variantId);
      const variantExists = product?.variants.some((variant) => variant.id === variantId && variant.isAvailable);
      return product && variantExists ? { ProductId: product.id, VariantId: variantId, Quantity: line.quantity } : null;
    });
    if (orderItems.some((item) => item === null)) {
      setConfirmationError("Um ou mais produtos não estão sincronizados com o catálogo. Atualize a página e tente novamente.");
      return;
    }

    setSubmittingOrder(true);
    setConfirmationError("");
    try {
      const notes = cartItems.map((line) => `${line.quantity}x ${line.item.name} (${line.variant.label})`).join("; ");
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryStreet: deliveryStreet.trim(),
          deliveryNumber: deliveryNumber.trim() || "S/N",
          deliveryNeighborhood: deliveryNeighborhood.trim(),
          deliveryCity: deliveryCity.trim(),
          paymentMethod: paymentMethod === "Pix" ? 1 : paymentMethod === "Dinheiro" ? 2 : 3,
          notes: `Itens: ${notes}`,
          items: orderItems,
        }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; message?: string; data?: { orderNumber: string } } | null;
      if (!response.ok || !result?.success || !result.data) {
        throw new Error(result?.message || "Não foi possível enviar o pedido. Tente novamente.");
      }

      setConfirmedOrderNumber(result.data.orderNumber);
      setCart([]);
      setCartOpen(false);
      setDeliveryNeighborhood("");
      setDeliveryStreet("");
      setDeliveryNumber("");
      setPaymentMethod("");
    } catch (error) {
      setConfirmationError(error instanceof Error ? error.message : "Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setSubmittingOrder(false);
    }
  }

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Bianca Lanches, início">
          <img className="brand-logo" src={logoImage} alt="" />
          <span className="brand-copy"><strong>BIANCA</strong><small>LANCHES</small></span>
        </a>
        {whatsappNumber && <a className="topbar-phone" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
          <span className="online-dot" /> Peça pelo WhatsApp <ArrowRight size={16} />
        </a>}
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Feito na hora, com carinho</p>
            <h1>O sabor que<br />chega <em>até você.</em></h1>
            <p className="hero-description">Pastéis crocantes, salgados quentinhos e aquele atendimento de casa.</p>
            <a className="hero-cta" href="#cardapio">Ver cardápio <ArrowDown size={18} /></a>
            <div className="hero-meta"><span><Clock3 size={15} /> Rápido e quentinho</span><i /> <span><MapPin size={15} /> Peça para entregar</span></div>
          </div>
          <div className="hero-visual" aria-label="Pastéis dourados, feitos na hora">
            <div className="hero-stamp">CROCANTE<br />DE VERDADE</div>
            <img src={heroImageUrl} alt="Pastéis dourados servidos fresquinhos" />
            <div className="hero-caption"><span>01</span><span>Pastel feito na hora</span><span className="caption-rule" /></div>
          </div>
          <div className="hero-bottom"><span>BIANCA LANCHES</span>{whatsappNumber && <span>{formatWhatsAppNumber(whatsappNumber)}</span>}</div>
        </section>

        <section className="menu-section" id="cardapio">
          <div className="menu-heading">
            <div>
              <p className="section-kicker">Escolha seus favoritos</p>
              <h2>Cardápio<span>.</span></h2>
            </div>
            <p className="menu-note">Rápido, quente e delicioso.<br />Do jeitinho que você gosta.</p>
          </div>

          <div className="menu-tools">
            <nav className="category-tabs" aria-label="Categorias do cardápio">
              {categories.map((category) => (
                <button key={category} className={`category-tab ${activeCategory === category ? "active" : ""}`} onClick={() => {
                  const targetId = category === "Todos" ? "cardapio" : `categoria-${category}`;
                  setSelectedCategory(category);
                  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActiveCategory(category);
                }} aria-current={activeCategory === category ? "location" : undefined}>
                  {category === "Pasteis tradicionais" ? "Pastéis" : category === "Salgados variados" ? "Salgados" : category}
                </button>
              ))}
            </nav>
            <label className="search-field">
              <Search size={17} />
              <input type="search" value={search} onChange={handleSearch} placeholder="Buscar no cardápio" aria-label="Buscar no cardápio" />
              {search && <button type="button" aria-label="Limpar busca" onClick={() => setSearch("")}><X size={15} /></button>}
            </label>
          </div>

          <div className="content-layout">
            <div className="catalog">
              {categorySections.length ? categorySections.map(({ category, items }) => <section className="category-section" id={`categoria-${category}`} data-menu-category={category} key={category}>
                <h3 className="category-heading">{category === "Pasteis tradicionais" ? "Pastéis" : category === "Salgados variados" ? "Salgados variados" : category}</h3>
                <div className="product-grid">
                {items.map((item, index) => {
                  const currentVariant = item.variants.find((variant) => variant.id === (selectedVariants[item.id] ?? item.variants.find((entry) => entry.price !== null)?.id));
                  const minimumPrice = Math.min(...item.variants.flatMap((variant) => variant.price === null ? [] : [variant.price]));
                  const imageLabel = item.category === "Bebidas" ? "BEBIDA" : item.category === "Salgados variados" ? "SALGADO" : "PASTEL";
                  return <article className="product-card" key={item.id} style={{ animationDelay: `${index * 45}ms` }}>
                    <div className="product-photo">
                      <img src={item.image} alt={item.imageAlt} loading="lazy" />
                      <span className="photo-tag">{imageLabel}</span>
                    </div>
                    <div className="product-info">
                      <div className="product-title-row"><h3>{item.name}</h3><span className="starting-price">{item.variants.length > 1 ? "a partir de " : ""}{formatPrice(minimumPrice)}</span></div>
                      <p>{item.description}</p>
                      <div className="product-actions">
                        <label className="variant-select-label" aria-label={`Tamanho de ${item.name}`}>
                          <select value={currentVariant?.id ?? ""} onChange={(event) => setSelectedVariants((current) => ({ ...current, [item.id]: event.target.value }))}>
                            {item.variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.price === null}>{variant.label}{variant.price === null ? " · indisponível" : ` · ${formatPrice(variant.price)}`}</option>)}
                          </select>
                        </label>
                        <button className="add-button" onClick={() => addToCart(item)} disabled={!currentVariant || currentVariant.price === null} aria-label={`Adicionar ${item.name} ao pedido`}><Plus size={17} /><span>Adicionar</span></button>
                      </div>
                    </div>
                  </article>;
                })}
                </div>
              </section>) : <div className="empty-results"><Search size={25} /><strong>Nenhum item encontrado</strong><span>Tente outro nome ou categoria.</span></div>}
            </div>

            <aside className="order-panel" aria-label="Seu pedido">
              <div className="order-panel-head"><div><span className="panel-kicker">Sua seleção</span><h3>Seu pedido <span>{cartCount}</span></h3></div><ShoppingBag size={21} /></div>
              {cartItems.length ? <div className="cart-lines">{cartItems.map((line) => <div className="cart-line" key={`${line.itemId}-${line.variantId}`}>
                <div className="cart-line-info"><strong>{line.item.name}</strong><span>{line.variant.label} · {formatPrice(line.variant.price!)}</span></div>
                <div className="quantity-control">
                  <button aria-label={`Diminuir ${line.item.name}`} onClick={() => changeQuantity(line.itemId, line.variantId, -1)}>{line.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}</button>
                  <span>{line.quantity}</span>
                  <button aria-label={`Aumentar ${line.item.name}`} onClick={() => changeQuantity(line.itemId, line.variantId, 1)}><Plus size={13} /></button>
                </div>
              </div>)}</div> : <div className="cart-empty"><span className="empty-bag"><ShoppingBag size={22} /></span><strong>Sua sacola está vazia</strong><span>Adicione seus favoritos para começar.</span></div>}
              <div className="order-total"><span>Total parcial</span><strong>{formatPrice(cartTotal)}</strong></div>
              {cartCount > 0 && <CheckoutDetails neighborhood={deliveryNeighborhood} onNeighborhoodChange={setDeliveryNeighborhood} street={deliveryStreet} onStreetChange={setDeliveryStreet} number={deliveryNumber} onNumberChange={setDeliveryNumber} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} onCheckout={checkout} />}
            </aside>
          </div>
        </section>

        <section className="closing-band">
          <div className="closing-copy"><p>Deu vontade?</p><h2>A gente leva<br />até você.</h2></div>
          {whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="closing-link">Chamar no WhatsApp <ArrowRight size={18} /></a>}
        </section>
      </main>

      <footer className="site-footer"><a className="footer-brand" href="#inicio"><img src={logoImage} alt="" /><span>BIANCA <b>LANCHES</b></span></a><span>Feito com carinho e servido quentinho.</span><span>© 2026 Bianca Lanches</span></footer>

      <button className="mobile-cart-button" onClick={() => setCartOpen(true)} aria-label={`Abrir sacola com ${cartCount} itens`}><ShoppingBag size={19} /><span>Sua sacola</span><b>{cartCount}</b><strong>{formatPrice(cartTotal)}</strong></button>
      {cartOpen && <div className="mobile-cart-overlay" onClick={() => setCartOpen(false)}>
        <section className="mobile-cart-sheet" onClick={(event) => event.stopPropagation()} aria-label="Sacola de compras">
          <button className="close-cart" onClick={() => setCartOpen(false)} aria-label="Fechar sacola"><X size={20} /></button>
          <div className="sheet-title"><span className="panel-kicker">Sua seleção</span><h2>Seu pedido <span>{cartCount}</span></h2></div>
          {cartItems.length ? <div className="cart-lines">{cartItems.map((line) => <div className="cart-line" key={`mobile-${line.itemId}-${line.variantId}`}>
            <div className="cart-line-info"><strong>{line.item.name}</strong><span>{line.variant.label} · {formatPrice(line.variant.price!)}</span></div>
            <div className="quantity-control"><button aria-label={`Diminuir ${line.item.name}`} onClick={() => changeQuantity(line.itemId, line.variantId, -1)}>{line.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}</button><span>{line.quantity}</span><button aria-label={`Aumentar ${line.item.name}`} onClick={() => changeQuantity(line.itemId, line.variantId, 1)}><Plus size={13} /></button></div>
          </div>)}</div> : <div className="cart-empty"><span className="empty-bag"><ShoppingBag size={22} /></span><strong>Sua sacola está vazia</strong><span>Adicione seus favoritos para começar.</span></div>}
          <div className="order-total"><span>Total parcial</span><strong>{formatPrice(cartTotal)}</strong></div>
          {cartCount > 0 && <CheckoutDetails neighborhood={deliveryNeighborhood} onNeighborhoodChange={setDeliveryNeighborhood} street={deliveryStreet} onStreetChange={setDeliveryStreet} number={deliveryNumber} onNumberChange={setDeliveryNumber} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} onCheckout={checkout} />}
        </section>
      </div>}
      {confirmationOpen && <div className="order-confirm-overlay" onClick={() => !submittingOrder && setConfirmationOpen(false)}>
        <section className="order-confirmation" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="order-confirm-title">
          <button className="close-cart" onClick={() => !submittingOrder && setConfirmationOpen(false)} aria-label="Fechar confirmação" disabled={submittingOrder}><X size={20} /></button>
          {confirmedOrderNumber ? <div className="order-confirm-success">
            <img src={logoImage} alt="Logo Bianca Lanches" />
            <span className="confirmation-check"><Check size={24} /></span>
            <p className="section-kicker">Pedido enviado</p>
            <h2 id="order-confirm-title">Recebemos seu pedido!</h2>
            <p>O pedido <strong>{confirmedOrderNumber}</strong> já foi enviado para a loja e está aguardando confirmação.</p>
            <button className="checkout-button" onClick={() => setConfirmationOpen(false)}><span>Voltar ao cardápio</span><ArrowRight size={17} /></button>
          </div> : <>
            <div className="order-confirm-heading">
              <img src={logoImage} alt="" />
              <div><p className="section-kicker">Só falta confirmar</p><h2 id="order-confirm-title">Revise seu pedido</h2></div>
            </div>
            <div className="confirmation-lines">{cartItems.map((line) => <div key={`confirm-${line.itemId}-${line.variantId}`}><span>{line.quantity}x {line.item.name} · {line.variant.label}</span><strong>{formatPrice(line.subtotal)}</strong></div>)}</div>
            <div className="confirmation-total"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></div>
            <div className="confirmation-address"><strong>Entrega</strong><span>{deliveryStreet.trim()}, {deliveryNumber.trim() || "S/N"} · {deliveryNeighborhood.trim()}</span><span>{deliveryCity.trim() || "Informe sua cidade abaixo"} · {paymentMethod}</span></div>
            <div className="confirmation-customer-fields">
              <label className="checkout-field">Seu nome<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" maxLength={150} required /></label>
              <label className="checkout-field">Telefone<input type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} autoComplete="tel" maxLength={30} required /></label>
              <label className="checkout-field">Cidade<input value={deliveryCity} onChange={(event) => setDeliveryCity(event.target.value)} autoComplete="address-level2" maxLength={100} required /></label>
            </div>
            {confirmationError && <p className="admin-error" role="alert">{confirmationError}</p>}
            <button className="checkout-button" onClick={confirmOrder} disabled={submittingOrder || cartCount === 0}><span>{submittingOrder ? "Enviando pedido..." : "Confirmar pedido"}</span><ArrowRight size={17} /></button>
            <p className="checkout-caption">Ao confirmar, o pedido será enviado para a loja.</p>
          </>}
        </section>
      </div>}
    </div>
  );
}

export default App;