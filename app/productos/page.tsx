import { getProducts } from "@/lib/repository/products";
import ProductosClient from "./ProductosClient";

export const revalidate = 60;

export default async function ProductosPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-8 w-full max-w-[1720px] mx-auto flex flex-col items-center">
      <div className="text-center mb-10 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          Nuestros Productos
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2">
          Línea exclusiva de pomadas, ceras y cuidado capilar seleccionados por nuestros barberos
        </p>
      </div>
      <ProductosClient products={products} />
    </div>
  );
}
