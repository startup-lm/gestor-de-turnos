import { IconType } from "react-icons";

export type CarouselType = "servicios" | "productos";

export interface CarouselItem {
  id: string | number;
  name: string;
  image?: string;
  icons?: IconType[];
};