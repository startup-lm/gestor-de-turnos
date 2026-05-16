ALTER TABLE "public"."business_settings"
ADD COLUMN "social_media" jsonb DEFAULT '[
  {"name": "instagram", "url": "", "active": true},
  {"name": "facebook", "url": "", "active": false},
  {"name": "tiktok", "url": "", "active": false}
]'::jsonb,
ADD COLUMN "our_story" text[] DEFAULT ARRAY[
  'Todo empezó en 2016, cuando armé una silla, un espejo y mi primera máquina en el garage de mi casa. Lo que arrancó como un hobby pronto se transformó en una pasión: brindar buenos cortes, charlas relajadas y un espacio donde todos se sintieran cómodos.',
  'Con el tiempo, esa pequeña idea creció y dio lugar a este lugar, pensado para que cada visita sea una experiencia. Acá no se trata solo de cortarte el pelo o arreglarte la barba: se trata de dedicarte tiempo, escucharte y cuidar cada detalle.',
  'Te esperamos para que disfrutes de un buen corte, un afeitado prolijo y un rato de desconexión de la rutina.'
];
