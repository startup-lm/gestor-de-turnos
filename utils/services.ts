import { FaScissors } from "react-icons/fa6";
import { GiBeard, GiAngryEyes } from "react-icons/gi";
import { IconType } from "react-icons";

export const servicesIcons = [
  {
    keyword: "corte",
    Icon: FaScissors,
  },
  {
    keyword: "barba",
    Icon: GiBeard,
  },
  {
    keyword: "cejas",
    Icon: GiAngryEyes,
  },
];

export function getServiceIcons(serviceName: string): IconType[] {
  const lowerCaseName = serviceName.toLowerCase();

  return servicesIcons
    .filter(({ keyword }) => lowerCaseName.includes(keyword))
    .map(({ Icon }) => Icon);
}
