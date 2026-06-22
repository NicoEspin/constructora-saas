export interface ConstructionItem {
  name: string;
  description: string;
  defaultTasks: string[];
}

export interface ConstructionCategory {
  label: string;
  items: ConstructionItem[];
}

function item(name: string, description: string, defaultTasks: string[]): ConstructionItem {
  return { name, description, defaultTasks };
}

export const CONSTRUCTION_ITEMS: ConstructionCategory[] = [
  {
    label: 'Demoliciones',
    items: [
      item('Demolición de cubierta', 'Retiro o demolición de techos, cubiertas existentes o estructuras superiores.', [
        'Verificar sector a demoler según plano o indicación.',
        'Retirar elementos sueltos, chapas, tejas, membranas o aislaciones.',
        'Demoler estructura de cubierta existente de forma controlada.',
        'Separar materiales reutilizables o descartables.',
        'Cargar escombros y dejar el sector limpio.',
      ]),
      item('Demolición de estructura de Hº Aº', 'Demolición de estructuras de hormigón armado.', [
        'Señalizar y asegurar el área de trabajo.',
        'Identificar elementos estructurales a demoler.',
        'Realizar corte, picado o rotura controlada del hormigón armado.',
        'Retirar hierros, escombros y restos de material.',
        'Verificar que no queden partes inestables.',
      ]),
      item('Demolición de losa de Hº Aº', 'Retiro o rotura de losas de hormigón armado existentes.', [
        'Apuntalar sectores cercanos si corresponde.',
        'Marcar el área exacta de demolición.',
        'Cortar o picar la losa de manera progresiva.',
        'Retirar hormigón y armaduras expuestas.',
        'Limpiar y revisar bordes de encuentro.',
      ]),
      item('Demolición de mampostería de ladrillo común', 'Demolición de muros o tabiques de ladrillo común.', [
        'Identificar muros a retirar.',
        'Verificar que no pasen instalaciones activas por el muro.',
        'Demoler mampostería de forma ordenada.',
        'Retirar ladrillos, mezcla y escombros.',
        'Dejar el área lista para nueva ejecución.',
      ]),
      item('Demolición de piso', 'Retiro de pisos existentes.', [
        'Retirar zócalos si corresponde.',
        'Levantar piezas de piso existentes.',
        'Remover adhesivos, mezcla o carpeta suelta.',
        'Cargar restos en contenedor.',
        'Verificar estado del contrapiso.',
      ]),
      item('Demolición de contrapisos', 'Rotura y retiro de contrapisos existentes.', [
        'Marcar sector a intervenir.',
        'Romper contrapiso existente.',
        'Retirar material demolido.',
        'Nivelar o limpiar superficie base.',
        'Revisar si hay cañerías o instalaciones afectadas.',
      ]),
      item('Demolición de revoque / revestimientos', 'Remoción de revoques, terminaciones o revestimientos colocados.', [
        'Identificar paños a retirar.',
        'Picar revoques, cerámicos o revestimientos existentes.',
        'Retirar restos de adhesivo o mezcla.',
        'Limpiar superficie del muro.',
        'Verificar si el soporte queda firme para recibir nueva terminación.',
      ]),
      item('Llenado de contenedores', 'Carga de escombros y residuos de obra en contenedores.', [
        'Acopiar escombros en sector seguro.',
        'Separar residuos pesados, livianos y reutilizables.',
        'Cargar contenedor sin superar capacidad.',
        'Mantener circulación de obra despejada.',
        'Coordinar retiro o recambio del contenedor.',
      ]),
    ],
  },
  {
    label: 'Preliminares',
    items: [
      item('Limpieza de terreno', 'Limpieza inicial del terreno antes de comenzar la obra.', [
        'Retirar basura, maleza y elementos sueltos.',
        'Despejar área de implantación de obra.',
        'Nivelar sectores básicos de circulación.',
        'Definir zona de acopio de materiales.',
        'Dejar terreno apto para replanteo.',
      ]),
      item('Replanteo', 'Marcación en obra de ejes, medidas y ubicación de elementos según planos.', [
        'Revisar planos de arquitectura y estructura.',
        'Marcar ejes principales de obra.',
        'Señalar límites, niveles y escuadras.',
        'Verificar medidas con cinta, nivel o láser.',
        'Registrar cualquier diferencia detectada.',
      ]),
      item('Cerco de obra', 'Colocación de cerramiento provisorio para delimitar y proteger la obra.', [
        'Definir perímetro de cerramiento.',
        'Colocar postes, paneles o malla de seguridad.',
        'Dejar acceso controlado para ingreso de materiales.',
        'Señalizar obra si corresponde.',
        'Verificar estabilidad del cerco.',
      ]),
    ],
  },
  {
    label: 'Excavaciones',
    items: [
      item('Excavación para pilotín 40 cm', 'Excavación lineal o puntual para ejecutar pilotines de fundación.', [
        'Marcar ubicación de pilotines.',
        'Verificar profundidad y diámetro requerido.',
        'Ejecutar perforación o excavación.',
        'Retirar tierra excedente.',
        'Revisar limpieza del fondo antes del armado.',
      ]),
      item('Excavación para pozos 60 cm hasta 10 m', 'Excavación para pozos de fundación de mayor diámetro y profundidad.', [
        'Marcar centros de pozos.',
        'Controlar diámetro y profundidad.',
        'Ejecutar excavación de forma segura.',
        'Retirar material excavado.',
        'Verificar estabilidad de paredes y fondo del pozo.',
      ]),
    ],
  },
  {
    label: 'Fundaciones, excavación y llenado',
    items: [
      item('Perforación, armado y llenado de pilotín 40 cm', 'Ejecución completa de pilotines, incluyendo perforación, armadura y hormigonado.', [
        'Marcar y perforar ubicación del pilotín.',
        'Preparar y colocar armadura.',
        'Verificar profundidad, verticalidad y limpieza.',
        'Hormigonar pilotín.',
        'Controlar nivel superior de terminación.',
      ]),
      item('Perforación, armado y llenado de pozo 60 cm', 'Ejecución completa de pozos de fundación con armadura y hormigón.', [
        'Ejecutar perforación según plano.',
        'Armar hierro correspondiente.',
        'Colocar armadura dentro del pozo.',
        'Llenar con hormigón.',
        'Verificar compactación y nivel de llenado.',
      ]),
      item('Platea de fundación de hormigón armado', 'Construcción de platea de hormigón armado como base estructural.', [
        'Preparar y compactar terreno.',
        'Colocar nylon, aislación o base según proyecto.',
        'Armar malla y refuerzos estructurales.',
        'Colocar pases de instalaciones si corresponde.',
        'Hormigonar, nivelar y curar la platea.',
      ]),
      item('Vigas de fundación', 'Ejecución de vigas inferiores que vinculan bases y soportan cargas.', [
        'Excavar zanja de viga.',
        'Armar y colocar hierros.',
        'Colocar encofrado si corresponde.',
        'Hormigonar viga.',
        'Controlar niveles, alineación y unión con bases.',
      ]),
      item('Zapata', 'Construcción de zapatas de fundación para transmitir cargas al suelo.', [
        'Excavar base de zapata.',
        'Compactar y limpiar fondo.',
        'Armar parrilla de hierro.',
        'Colocar armadura de espera para columna.',
        'Hormigonar y nivelar.',
      ]),
      item('Base de columna', 'Ejecución de bases puntuales para columnas estructurales.', [
        'Marcar ubicación de base.',
        'Excavar y preparar apoyo.',
        'Armar hierro de base y esperas.',
        'Colocar encofrado si corresponde.',
        'Hormigonar y controlar plomo de esperas.',
      ]),
    ],
  },
  {
    label: 'Hormigón armado',
    items: [
      item('Losa maciza espesor 10 cm', 'Ejecución de losa maciza de hormigón armado.', [
        'Colocar apuntalamiento y encofrado.',
        'Armar hierros y refuerzos.',
        'Colocar pases eléctricos o sanitarios.',
        'Hormigonar la losa.',
        'Nivelar, curar y desencofrar cuando corresponda.',
      ]),
      item('Losa nervurada con bloque de telgopor', 'Construcción de losa alivianada con nervios y bloques de telgopor.', [
        'Montar apuntalamiento y fondo de losa.',
        'Colocar nervios, armaduras y bloques de telgopor.',
        'Revisar pases de instalaciones.',
        'Hormigonar y vibrar correctamente.',
        'Curar la losa y retirar apuntalamiento según tiempos técnicos.',
      ]),
      item('Losa de viguetas pretensadas', 'Ejecución de losa con viguetas prefabricadas y elementos de relleno.', [
        'Colocar viguetas según distribución.',
        'Colocar bloques de relleno.',
        'Armar capa de compresión y malla.',
        'Hormigonar capa superior.',
        'Curar y controlar deformaciones.',
      ]),
      item('Vigas y columnas encadenados 15x15 cm', 'Construcción de encadenados estructurales para vincular muros.', [
        'Marcar recorrido de encadenados.',
        'Armar hierros.',
        'Colocar encofrados.',
        'Hormigonar.',
        'Controlar nivel, plomo y continuidad estructural.',
      ]),
      item('Viga estructural', 'Ejecución de vigas principales de hormigón armado.', [
        'Preparar encofrado.',
        'Armar hierro según cálculo.',
        'Verificar apoyos y uniones.',
        'Hormigonar y vibrar.',
        'Curar y desencofrar.',
      ]),
      item('Columna estructural', 'Ejecución de columnas de hormigón armado para soporte vertical.', [
        'Verificar ubicación y plomo de esperas.',
        'Armar columna.',
        'Colocar encofrado.',
        'Hormigonar por etapas si corresponde.',
        'Controlar plomo, alineación y curado.',
      ]),
      item('Dinteles 15x15 cm', 'Construcción de dinteles sobre aberturas como puertas y ventanas.', [
        'Marcar ubicación sobre aberturas.',
        'Preparar apoyo lateral.',
        'Armar hierro del dintel.',
        'Encofrar y hormigonar.',
        'Verificar nivel y apoyo correcto.',
      ]),
    ],
  },
  {
    label: 'Mampostería',
    items: [
      item('Bloque de hormigón 19x19x39', 'Levantamiento de muros con bloques de hormigón grandes.', [
        'Marcar línea de muro.',
        'Preparar mezcla de asiento.',
        'Levantar hiladas controlando plomo y nivel.',
        'Colocar refuerzos o encadenados si corresponde.',
        'Limpiar juntas y excedentes.',
      ]),
      item('Bloque de hormigón 10x19x39', 'Construcción de tabiques o muros con bloques de hormigón angostos.', [
        'Replantear ubicación del tabique.',
        'Preparar mezcla.',
        'Levantar muro por hiladas.',
        'Controlar alineación y encuentros.',
        'Limpiar superficie final.',
      ]),
      item('Ladrillo común para cimiento 30 cm', 'Mampostería de ladrillo común para sectores de fundación o cimiento.', [
        'Verificar base de apoyo.',
        'Preparar mezcla hidrófuga si corresponde.',
        'Levantar mampostería de cimiento.',
        'Controlar nivel y espesor.',
        'Dejar lista la superficie para capa aisladora.',
      ]),
      item('Ladrillo común para elevación 30 cm', 'Levantamiento de muros portantes o exteriores de 30 cm.', [
        'Marcar eje de muro.',
        'Preparar mezcla de asiento.',
        'Levantar mampostería.',
        'Controlar plomo, nivel y trabas.',
        'Dejar previstos vanos e instalaciones.',
      ]),
      item('Ladrillo común para elevación 15 cm', 'Levantamiento de muros o tabiques de ladrillo común de 15 cm.', [
        'Replantear tabiques o muros.',
        'Levantar hiladas con mezcla.',
        'Controlar plomo y escuadra.',
        'Resolver encuentros con otros muros.',
        'Limpiar excedentes de mezcla.',
      ]),
      item('Ladrillo visto 15 cm con tomado de junta', 'Muro de ladrillo visto con terminación de juntas.', [
        'Seleccionar ladrillos visibles.',
        'Levantar muro cuidando alineación.',
        'Tomar juntas con terminación prolija.',
        'Limpiar restos de mezcla.',
        'Proteger superficie hasta terminación final.',
      ]),
      item('Ladrillo cerámico hueco 18x18x32', 'Construcción de muros con ladrillo cerámico hueco de mayor espesor.', [
        'Marcar muro según plano.',
        'Preparar mezcla.',
        'Levantar hiladas.',
        'Controlar plomo, nivel y encuentros.',
        'Prever pases de instalaciones.',
      ]),
      item('Ladrillo cerámico hueco 12x18x33', 'Construcción de tabiques o muros con ladrillo cerámico hueco.', [
        'Replantear tabique.',
        'Colocar ladrillos con mezcla.',
        'Verificar alineación y nivel.',
        'Resolver encuentros con columnas o muros.',
        'Limpiar superficie.',
      ]),
    ],
  },
  {
    label: 'Capa aisladora',
    items: [
      item('Capa aisladora horizontal sobre contrapiso 2 cm', 'Barrera contra humedad colocada sobre contrapiso.', [
        'Limpiar superficie de aplicación.',
        'Preparar mezcla hidrófuga.',
        'Aplicar capa uniforme.',
        'Controlar continuidad en toda la superficie.',
        'Dejar fraguar antes de continuar.',
      ]),
      item('Capa aisladora horizontal espesor 2 cm', 'Ejecución de capa aisladora horizontal en muros o bases.', [
        'Preparar asiento sobre mampostería.',
        'Aplicar mezcla hidrófuga.',
        'Controlar espesor y continuidad.',
        'Evitar cortes o interrupciones.',
        'Verificar protección contra humedad ascendente.',
      ]),
      item('Capa aisladora vertical en muros 1,5 cm', 'Protección vertical contra humedad en muros.', [
        'Limpiar muro.',
        'Preparar mezcla impermeable.',
        'Aplicar capa vertical.',
        'Controlar cobertura completa.',
        'Dejar superficie lista para revoque o terminación.',
      ]),
    ],
  },
  {
    label: 'Cubierta de techos',
    items: [
      item('Cubierta común sobre losa horizontal con fibrado', 'Impermeabilización de losa horizontal con producto fibrado.', [
        'Limpiar losa.',
        'Reparar fisuras o imperfecciones.',
        'Aplicar imprimación si corresponde.',
        'Colocar impermeabilizante fibrado.',
        'Verificar pendientes y desagües.',
      ]),
      item('Cubierta común sobre losa horizontal con membrana aluminizada', 'Impermeabilización de losa con membrana aluminizada.', [
        'Limpiar y preparar superficie.',
        'Revisar pendientes y desagües.',
        'Aplicar imprimación.',
        'Colocar membrana con solapes correctos.',
        'Sellar encuentros, bordes y embudos.',
      ]),
    ],
  },
  {
    label: 'Revoques',
    items: [
      item('Grueso y fino interior', 'Revoque interior completo con capa gruesa y terminación fina.', [
        'Preparar superficie del muro.',
        'Colocar fajas y guías.',
        'Aplicar revoque grueso.',
        'Aplicar revoque fino.',
        'Controlar plomo, nivel y terminación.',
      ]),
      item('Grueso y fino impermeable exterior', 'Revoque exterior con protección impermeable.', [
        'Limpiar y humedecer muro.',
        'Aplicar capa impermeable.',
        'Ejecutar revoque grueso exterior.',
        'Aplicar fino o terminación.',
        'Revisar fisuras y continuidad.',
      ]),
      item('Fino a la cal', 'Terminación fina tradicional con mezcla a la cal.', [
        'Verificar que el grueso esté firme.',
        'Preparar mezcla fina.',
        'Aplicar capa de terminación.',
        'Fratasar o alisar superficie.',
        'Dejar lista para pintura.',
      ]),
      item('Grueso bajo revestimiento', 'Revoque base preparado para recibir revestimientos.', [
        'Preparar superficie.',
        'Colocar guías.',
        'Aplicar revoque grueso.',
        'Rayar o dejar mordiente para adhesivo.',
        'Controlar planitud.',
      ]),
      item('Grueso impermeable exterior fratasado', 'Revoque exterior impermeable con terminación fratasada.', [
        'Limpiar muro exterior.',
        'Aplicar mezcla impermeable.',
        'Ejecutar revoque grueso.',
        'Fratasar terminación.',
        'Controlar continuidad contra humedad.',
      ]),
      item('Revoque plástico exterior', 'Terminación exterior con revestimiento plástico decorativo.', [
        'Preparar base firme y nivelada.',
        'Aplicar imprimación.',
        'Colocar revestimiento plástico.',
        'Texturar según terminación elegida.',
        'Revisar uniformidad de color y textura.',
      ]),
      item('Enlucido de yeso', 'Terminación interior lisa con yeso.', [
        'Preparar superficie interior.',
        'Aplicar yeso.',
        'Alisar y nivelar.',
        'Corregir imperfecciones.',
        'Dejar listo para pintura.',
      ]),
    ],
  },
  {
    label: 'Cielorraso',
    items: [
      item('Cielorraso aplicado con revoque fino/grueso sobre metal desplegado', 'Ejecución de cielorraso aplicado con soporte metálico.', [
        'Colocar estructura o soporte.',
        'Fijar metal desplegado.',
        'Aplicar revoque grueso.',
        'Aplicar fino de terminación.',
        'Controlar nivel y fisuras.',
      ]),
      item('Cielorraso aplicado con revoque común fino/grueso', 'Terminación de cielorraso con revoque tradicional.', [
        'Preparar superficie.',
        'Colocar guías.',
        'Aplicar revoque grueso.',
        'Aplicar terminación fina.',
        'Verificar nivel y acabado.',
      ]),
      item('Cielorraso aplicado de yeso', 'Terminación de cielorraso con yeso aplicado.', [
        'Preparar superficie.',
        'Aplicar yeso.',
        'Nivelar y alisar.',
        'Corregir imperfecciones.',
        'Dejar listo para pintura.',
      ]),
    ],
  },
  {
    label: 'Contrapiso y carpetas',
    items: [
      item('Hormigón espesor 10 cm sobre terreno natural', 'Ejecución de contrapiso de hormigón sobre suelo compactado.', [
        'Compactar terreno.',
        'Colocar reglas o niveles.',
        'Ejecutar contrapiso de hormigón.',
        'Nivelar superficie.',
        'Curar y proteger hasta fragüe.',
      ]),
      item('Hormigón espesor 7 cm sobre losa', 'Contrapiso liviano o de nivelación sobre losa existente.', [
        'Limpiar losa existente.',
        'Marcar niveles.',
        'Ejecutar contrapiso.',
        'Nivelar y alisar.',
        'Verificar pendientes si corresponde.',
      ]),
      item('Carpeta de nivelación', 'Capa final para nivelar y preparar la superficie antes del piso.', [
        'Limpiar base.',
        'Colocar fajas de nivel.',
        'Aplicar carpeta.',
        'Fratasar superficie.',
        'Dejar lista para colocación de piso.',
      ]),
    ],
  },
  {
    label: 'Pisos',
    items: [
      item('Porcelanato', 'Colocación de piso de porcelanato.', [
        'Verificar nivelación de carpeta.',
        'Presentar piezas y definir cortes.',
        'Aplicar adhesivo.',
        'Colocar porcelanatos con separadores.',
        'Pastinar, limpiar y revisar juntas.',
      ]),
      item('Cerámico', 'Colocación de piso cerámico.', [
        'Preparar superficie.',
        'Modular piezas.',
        'Colocar adhesivo.',
        'Instalar cerámicos.',
        'Pastinar y limpiar.',
      ]),
      item('Carpeta estucada', 'Terminación de piso con carpeta estucada.', [
        'Preparar base.',
        'Aplicar mezcla de terminación.',
        'Nivelar y alisar.',
        'Realizar curado.',
        'Proteger hasta secado final.',
      ]),
      item('Hormigón con piedra lavada', 'Piso de hormigón decorativo con piedra expuesta.', [
        'Preparar base y moldes.',
        'Colocar hormigón con agregado.',
        'Nivelar superficie.',
        'Lavar para exponer piedra.',
        'Curar y proteger terminación.',
      ]),
      item('Piso flotante', 'Colocación de piso flotante sobre superficie nivelada.', [
        'Verificar humedad y nivel de base.',
        'Colocar manta o base aislante.',
        'Instalar tablas o placas.',
        'Colocar zócalos o terminaciones.',
        'Revisar juntas y encuentros.',
      ]),
    ],
  },
  {
    label: 'Zócalos',
    items: [
      item('Zócalo de cemento estucado h:10 cm', 'Ejecución de zócalo cementicio de 10 cm de altura.', [
        'Marcar altura de zócalo.',
        'Preparar mezcla.',
        'Ejecutar zócalo.',
        'Alisar terminación.',
        'Verificar continuidad y limpieza.',
      ]),
      item('Zócalo de cerámico', 'Colocación de zócalo cerámico.', [
        'Cortar piezas si corresponde.',
        'Aplicar adhesivo.',
        'Colocar zócalos.',
        'Pastinar juntas.',
        'Limpiar excedentes.',
      ]),
      item('Zócalo de porcelanato', 'Colocación de zócalo de porcelanato.', [
        'Preparar piezas.',
        'Aplicar adhesivo.',
        'Colocar zócalos alineados.',
        'Pastinar.',
        'Revisar encuentros y terminación.',
      ]),
    ],
  },
  {
    label: 'Revestimiento',
    items: [
      item('Revestimiento de cerámico', 'Colocación de revestimiento cerámico en muros o superficies verticales.', [
        'Preparar muro.',
        'Modular piezas y definir cortes.',
        'Aplicar adhesivo.',
        'Colocar cerámicos.',
        'Pastinar y limpiar.',
      ]),
      item('Revestimiento de porcelanato', 'Colocación de porcelanato como revestimiento.', [
        'Verificar planitud del muro.',
        'Presentar piezas.',
        'Aplicar adhesivo adecuado.',
        'Colocar porcelanato.',
        'Pastinar y controlar juntas.',
      ]),
      item('Revestimiento de venecita', 'Colocación de venecitas decorativas.', [
        'Preparar base.',
        'Marcar niveles y paños.',
        'Colocar planchas de venecita.',
        'Pastinar cuidadosamente.',
        'Limpiar superficie sin dañar piezas.',
      ]),
      item('Revestimiento de piedra natural', 'Colocación de piedra natural en muros o superficies decorativas.', [
        'Preparar soporte.',
        'Seleccionar y presentar piezas.',
        'Aplicar adhesivo o mezcla correspondiente.',
        'Colocar piedra natural.',
        'Sellar o proteger si corresponde.',
      ]),
    ],
  },
  {
    label: 'Construcción en seco',
    items: [
      item('Tabique espesor 9,5 cm', 'Construcción de tabique liviano en seco.', [
        'Replantear ubicación del tabique.',
        'Colocar perfiles y estructura.',
        'Fijar placas.',
        'Tomar juntas.',
        'Lijar y dejar listo para pintura.',
      ]),
      item('Tabique espesor 9,5 cm con placa verde', 'Tabique en seco con placa resistente a humedad.', [
        'Replantear tabique en zona húmeda.',
        'Colocar estructura metálica.',
        'Fijar placas verdes resistentes a humedad.',
        'Tomar juntas con material adecuado.',
        'Sellar encuentros y dejar listo para revestir o pintar.',
      ]),
      item('Tabique espesor 9,5 cm con lana de vidrio', 'Tabique en seco con aislación térmica o acústica.', [
        'Armar estructura de perfiles.',
        'Colocar primera cara de placas.',
        'Instalar lana de vidrio.',
        'Cerrar segunda cara del tabique.',
        'Tomar juntas y verificar aislación.',
      ]),
      item('Medio tabique espesor 5 cm', 'Tabique liviano de menor espesor para divisiones o revestimientos.', [
        'Marcar ubicación.',
        'Colocar perfiles.',
        'Fijar placas.',
        'Tomar juntas.',
        'Revisar terminación y estabilidad.',
      ]),
      item('Cielorraso suspendido junta tomada', 'Cielorraso suspendido con placas y juntas tomadas.', [
        'Marcar nivel de cielorraso.',
        'Colocar estructura suspendida.',
        'Fijar placas.',
        'Tomar juntas.',
        'Lijar y dejar listo para pintura.',
      ]),
      item('Cielorraso suspendido desmontable 60x60 cm', 'Cielorraso modular desmontable con placas de 60x60 cm.', [
        'Marcar nivel.',
        'Colocar perfilería.',
        'Instalar tensores y estructura.',
        'Colocar placas desmontables.',
        'Revisar alineación y acceso a instalaciones.',
      ]),
    ],
  },
  {
    label: 'Pintura',
    items: [
      item('Pintura al látex en muros interiores', 'Pintura interior sobre paredes.', [
        'Lijar y limpiar superficies.',
        'Aplicar sellador o fijador.',
        'Masillar imperfecciones.',
        'Aplicar manos de látex interior.',
        'Revisar cobertura y retoques.',
      ]),
      item('Pintura al látex en muros exteriores', 'Pintura exterior resistente a la intemperie.', [
        'Limpiar fachada.',
        'Reparar fisuras.',
        'Aplicar fijador exterior.',
        'Pintar con látex exterior.',
        'Revisar terminación y protección climática.',
      ]),
      item('Barniz sobre carpintería de madera', 'Protección y terminación de elementos de madera.', [
        'Lijar madera.',
        'Limpiar polvo.',
        'Aplicar primera mano de barniz.',
        'Lijar suavemente entre manos.',
        'Aplicar terminación final.',
      ]),
      item('Esmalte sintético sobre carpintería metálica', 'Pintura de protección y terminación sobre metal.', [
        'Lijar o limpiar metal.',
        'Aplicar antióxido si corresponde.',
        'Aplicar esmalte sintético.',
        'Revisar cobertura.',
        'Realizar retoques finales.',
      ]),
      item('Impermeabilizante sobre ladrillo visto', 'Protección impermeable para muros de ladrillo visto.', [
        'Limpiar ladrillo.',
        'Verificar juntas y fisuras.',
        'Aplicar impermeabilizante.',
        'Controlar absorción.',
        'Revisar terminación uniforme.',
      ]),
      item('Fibrado para techos', 'Aplicación de impermeabilizante fibrado en cubiertas.', [
        'Limpiar cubierta.',
        'Reparar fisuras o encuentros.',
        'Aplicar primera mano de fibrado.',
        'Reforzar puntos críticos.',
        'Aplicar mano final y verificar impermeabilidad.',
      ]),
    ],
  },
  {
    label: 'Carpinterías',
    items: [
      item('Colocación de premarcos', 'Instalación de premarcos para futuras aberturas.', [
        'Verificar medidas del vano.',
        'Presentar premarco.',
        'Aplomar y nivelar.',
        'Fijar premarco.',
        'Controlar escuadra y protección hasta colocar abertura.',
      ]),
      item('Colocación de aberturas', 'Instalación de puertas, ventanas u otros cerramientos.', [
        'Verificar vano y premarco.',
        'Presentar abertura.',
        'Aplomar, nivelar y fijar.',
        'Sellar encuentros.',
        'Probar apertura, cierre y funcionamiento.',
      ]),
    ],
  },
];
