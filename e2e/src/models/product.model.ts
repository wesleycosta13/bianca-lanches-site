export interface ProductFilter {
  category?: string;
  searchTerm?: string;
}

export interface ProductDetails {
  name: string;
  description?: string;
  startingPrice?: string;
  variant?: string;
}
