import { getProducts } from "@/lib/repository/products";
import ProductosClient from "./ProductosClient";

export const revalidate = 60;

export default async function ProductosPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-8 w-full max-w-[1720px] mx-auto flex flex-col items-center">
      <ProductosClient products={products} />
    </div>
  );
}
