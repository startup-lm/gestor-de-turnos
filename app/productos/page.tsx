import { getProducts } from "@/lib/repository/products";
import ProductosClient from "./ProductosClient";

export const revalidate = 60;

export default async function ProductosPage() {
  const products = await getProducts();

  return (
    <div className="p-5 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-5">Nuestros Productos</h1>
      <ProductosClient products={products} />
    </div>
  );
}
