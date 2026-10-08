export type MenuVariant = {
  id: string;
  label: string;
  price: number | null;
};

export type MenuItem = {
  id: string;
  name: string;
  category: "Pasteis tradicionais" | "Salgados variados" | "Bebidas";
  description: string;
  image: string;
  imageAlt: string;
  variants: MenuVariant[];
};

const pastelSizes = (small: number, large: number, extraLarge: number): MenuVariant[] => [
  { id: "P", label: "P", price: small },
  { id: "G", label: "G", price: large },
  { id: "GG", label: "GG", price: extraLarge },
];

const pastelImage = "";
const snackImage = "";
const drinkImage = "";

export const menuItems: MenuItem[] = [
  { id: "carne", name: "Carne", category: "Pasteis tradicionais", description: "Recheio bem temperado, feito na casa.", image: pastelImage, imageAlt: "Pastel dourado e crocante", variants: pastelSizes(3, 6, 14) },
  { id: "queijo", name: "Queijo", category: "Pasteis tradicionais", description: "Queijo derretido em massa crocante.", image: pastelImage, imageAlt: "Pastel dourado e crocante", variants: pastelSizes(3, 6, 14) },
  { id: "frango", name: "Frango", category: "Pasteis tradicionais", description: "Frango temperado para comer quentinho.", image: pastelImage, imageAlt: "Pastel dourado e crocante", variants: pastelSizes(3, 6, 14) },
  { id: "calabresa", name: "Calabresa", category: "Pasteis tradicionais", description: "Calabresa saborosa, preparada na hora.", image: pastelImage, imageAlt: "Pastel dourado e crocante", variants: pastelSizes(3, 6, 14) },
  { id: "misto", name: "Misto", category: "Pasteis tradicionais", description: "A combinação clássica de presunto e queijo.", image: pastelImage, imageAlt: "Pastel dourado e crocante", variants: pastelSizes(3, 6, 14) },
  { id: "carne-de-sol", name: "Carne de Sol", category: "Pasteis tradicionais", description: "Carne de sol com aquele sabor do Nordeste.", image: pastelImage, imageAlt: "Pastel dourado e crocante", variants: pastelSizes(3, 7, 15) },
  { id: "coxinha", name: "Coxinha", category: "Salgados variados", description: "Massa macia, recheio generoso e casquinha crocante.", image: snackImage, imageAlt: "Salgado frito, dourado e crocante", variants: [{ id: "unidade", label: "Unidade", price: 12.5 }] },
  { id: "risole", name: "Risole", category: "Salgados variados", description: "Douradinho por fora, macio por dentro.", image: snackImage, imageAlt: "Salgado frito, dourado e crocante", variants: [{ id: "unidade", label: "Unidade", price: 13.5 }] },
  { id: "enroladinho", name: "Enroladinho", category: "Salgados variados", description: "Massa leve, assada até ficar no ponto.", image: snackImage, imageAlt: "Salgado frito, dourado e crocante", variants: [{ id: "unidade", label: "Unidade", price: 14.5 }] },
  { id: "bolinha-de-carne", name: "Bolinha de carne", category: "Salgados variados", description: "Pequena no tamanho, cheia de sabor.", image: snackImage, imageAlt: "Salgado frito, dourado e crocante", variants: [{ id: "unidade", label: "Unidade", price: 16.5 }] },
  { id: "coca-cola", name: "Coca-Cola", category: "Bebidas", description: "Gelada para acompanhar seu lanche.", image: drinkImage, imageAlt: "Bebida gelada servida com gelo", variants: [{ id: "250ml", label: "250 ml", price: 3.5 }, { id: "1l", label: "1 L", price: 9 }, { id: "2l", label: "2 L", price: 12 }] },
  { id: "guarana", name: "Guaraná", category: "Bebidas", description: "Refrescante do primeiro ao último gole.", image: drinkImage, imageAlt: "Bebida gelada servida com gelo", variants: [{ id: "250ml", label: "250 ml", price: 2 }, { id: "1l", label: "1 L", price: 7 }, { id: "2l", label: "2 L", price: 12 }] },
  { id: "pepsi", name: "Pepsi", category: "Bebidas", description: "Uma pausa gelada para acompanhar.", image: drinkImage, imageAlt: "Bebida gelada servida com gelo", variants: [{ id: "250ml", label: "250 ml", price: 3.5 }, { id: "1l", label: "1 L", price: 7 }, { id: "2l", label: "2 L", price: 10 }] },
  { id: "fanta-laranja", name: "Fanta Laranja", category: "Bebidas", description: "Sabor de laranja bem geladinho.", image: drinkImage, imageAlt: "Bebida gelada servida com gelo", variants: [{ id: "250ml", label: "250 ml", price: 3.5 }, { id: "1l", label: "1 L", price: null }, { id: "2l", label: "2 L", price: 12 }] },
  { id: "fanta-uva", name: "Fanta Uva", category: "Bebidas", description: "Refrescante e pronta para a hora do lanche.", image: drinkImage, imageAlt: "Bebida gelada servida com gelo", variants: [{ id: "250ml", label: "250 ml", price: 3.5 }, { id: "1l", label: "1 L", price: null }, { id: "2l", label: "2 L", price: 12 }] },
  { id: "cajuina", name: "Cajuína", category: "Bebidas", description: "O gostinho regional que combina com tudo.", image: drinkImage, imageAlt: "Bebida gelada servida com gelo", variants: [{ id: "250ml", label: "250 ml", price: null }, { id: "1l", label: "1 L", price: 9 }, { id: "2l", label: "2 L", price: 12 }] },
];

export const categories = ["Todos", "Pasteis tradicionais", "Salgados variados", "Bebidas"] as const;

export function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}