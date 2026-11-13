import heroImg from '../assets/images/hero_mercado_trust_1794578223896.jpg';
import cafeHuilaImg from '../assets/images/product_cafe_huila_1794578223184.jpg';
import audifonosProImg from '../assets/images/product_audifonos_pro_1794578223194.jpg';
import billeteraCueroImg from '../assets/images/product_billetera_cuero_1794578224008.jpg';
import termoAceroImg from '../assets/images/product_termo_acero_1794578224139.jpg';
import lamparaEscritorioImg from '../assets/images/product_lampara_escritorio_1794578225014.jpg';
import kitSkincareImg from '../assets/images/product_kit_skincare_1794578226274.jpg';
import mochilaWayuuImg from '../assets/images/product_mochila_wayuu_1794578226512.jpg';

export const HERO_IMAGE = heroImg;

export const IMAGE_REGISTRY: Record<string, string> = {
  '/src/assets/images/hero_mercado_trust_1794578223896.jpg': heroImg,
  '/src/assets/images/product_cafe_huila_1794578223184.jpg': cafeHuilaImg,
  '/src/assets/images/product_audifonos_pro_1794578223194.jpg': audifonosProImg,
  '/src/assets/images/product_billetera_cuero_1794578224008.jpg': billeteraCueroImg,
  '/src/assets/images/product_termo_acero_1794578224139.jpg': termoAceroImg,
  '/src/assets/images/product_lampara_escritorio_1794578225014.jpg': lamparaEscritorioImg,
  '/src/assets/images/product_kit_skincare_1794578226274.jpg': kitSkincareImg,
  '/src/assets/images/product_mochila_wayuu_1794578226512.jpg': mochilaWayuuImg,
};

export const GALLERY_PRESET_IMAGES = [
  { label: 'Café del Huila', url: '/src/assets/images/product_cafe_huila_1794578223184.jpg' },
  { label: 'Audífonos Studio', url: '/src/assets/images/product_audifonos_pro_1794578223194.jpg' },
  { label: 'Billetera Cuero', url: '/src/assets/images/product_billetera_cuero_1794578224008.jpg' },
  { label: 'Termo Acero', url: '/src/assets/images/product_termo_acero_1794578224139.jpg' },
  { label: 'Lámpara Escritorio', url: '/src/assets/images/product_lampara_escritorio_1794578225014.jpg' },
  { label: 'Kit Cuidado Facial', url: '/src/assets/images/product_kit_skincare_1794578226274.jpg' },
  { label: 'Mochila Tejida', url: '/src/assets/images/product_mochila_wayuu_1794578226512.jpg' },
];

export function resolveProductImage(url: string | undefined | null): string {
  if (!url) return '';
  return IMAGE_REGISTRY[url] ?? url;
}
