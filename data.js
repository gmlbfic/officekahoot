const ORDER = ["DW","JI","MI","PA","OS","KE","RY","ME","TO"];
const CH = {
  MI:{name:"Michael Scott", color:"#C8312B", emblem:"🏆", bio:"Necesitás público como otros necesitan oxígeno. Sos de los que cuentan un chiste en la reunión, nadie se ríe, y entonces lo explican. Probablemente tus amigos tienen un grupo de WhatsApp sin vos; vos preferís creer que es para organizarte un cumpleaños sorpresa. Pero cuando alguien la está pasando mal, sos el primero en aparecer: con un abrazo demasiado largo y el corazón en la mano."},
  JI:{name:"Jim Halpert", color:"#3E6FB0", emblem:"✈️", bio:"Tu verdadero talento es parecer ocupado. Tenés más capacidad de la que usás, lo sabés, y te resulta bastante cómodo. En el liceo eras el que hacía reír a toda la clase y aun así salvaba la prueba. Esquivás los problemas con una mirada cómplice al que tengas cerca. Pero cuando algo te importa de verdad, dejás la ironía en la puerta y vas con todo."},
  PA:{name:"Pam Beesly", color:"#C2577F", emblem:"🎨", bio:"Sos la persona más amable del grupo y también la que más cosas se guarda. Tenés un cuaderno de ideas que nadie vio y un \u201calgún día\u201d que venís postergando hace años. Te quedaste en lugares más tiempo del debido por no incomodar a nadie. Pero cuando te animás, sorprendés a todos, empezando por vos."},
  DW:{name:"Dwight Schrute", color:"#9A7B12", emblem:"🌱", bio:"Tenés un plan para el apocalipsis zombi, y probablemente un kit armado. Para vos las reglas no son una sugerencia sino una forma de vida, y si no existen, las inventás. Tus compañeros te tienen un poco de miedo y bastante cansancio. Pero si algo tiene que salir bien sí o sí, te llaman a vos, y no fallás."},
  OS:{name:"Oscar Martínez", color:"#2E7D6B", emblem:"📚", bio:"\u201cEn realidad\u2026\u201d es tu muletilla. Corregís datos en charlas casuales, en grupos de WhatsApp y probablemente en tu cabeza mientras leés esto. Tenés gustos caros y paciencia barata para la ignorancia ajena. Pero cuando las cosas se ponen feas, sos el adulto en la sala y el amigo que nunca suelta."},
  KE:{name:"Kevin Malone", color:"#D07A1F", emblem:"🍪", bio:"Tu relación más estable es con la comida. Evaluás los cumpleaños por la picada y los planes según si hay buffet. La gente a veces te subestima, y vos la dejás porque es más cómodo. Pero en todo el edificio no hay nadie más generoso ni más fácil de querer."},
  RY:{name:"Ryan Howard", color:"#6B4FA0", emblem:"📈", bio:"Cambiaste de estética, de plan de vida y de cafetería favorita más veces que de celular. Tenés una idea de negocio por mes y una bio que dice \u201cemprendedor\u201d. A veces confundís verse exitoso con serlo. Pero tenés hambre real de ser más, y eso, bien apuntado, te puede llevar lejos."},
  ME:{name:"Meredith Palmer", color:"#B0306A", emblem:"🍸", bio:"El filtro social no vino incluido en tu modelo. Sos la que propone \u201cuna más\u201d a las tres de la mañana y la que tiene las mejores anécdotas del grupo, aunque no te acuerdes de la mitad. Te pasan cosas que a nadie más le pasan. Pero nunca fingís ser otra persona, y en un mundo de poses eso es rarísimo."},
  TO:{name:"Toby Flenderson", color:"#66737D", emblem:"📋", bio:"Sos la voz de la sensatez en un lugar que no quiere escucharla. Te toca decir lo que nadie quiere oír, y por eso la culpa siempre termina siendo tuya. Hay días en que sentís que podrías desaparecer y tardarían en notarlo. Pero tenés una paciencia de santo, y quien te conoce de verdad sabe lo que valés."}
};

// ---------- Preguntas: [texto, emoji provisorio, principal, secundario, imagen] ----------
// Cuando estén las imágenes de Magnific, se completa el 5.º campo con su URL o data URI.
const Q = [
 {q:"Estás en una cumbre de asado. ¿Qué hacés?", c:"#E9B07A", o:[
  ["Hacés el asado, y nadie más toca la parrilla","🔥","DW","TO"],
  ["Te dedicás a ensuciar: cuatro vasos, tres platos y la tabla del chorizo","🍽️","MI","RY"],
  ["Tomás algo desde la reposera y garroneás sin culpa","🍺","JI","PA"],
  ["Llorás por el pedazo de pan que no comiste","🥖","KE","MI"],
  ["Le explicás al asador cuál es el punto exacto de la carne","🥩","OS","TO"],
  ["Lavás todo mientras los demás comen","🧽","PA","JI"]]},
 {q:"Te toca el amigo invisible. ¿Qué regalás?", c:"#9CC5A1", o:[
  ["Un kit de supervivencia","🎒","DW","KE"],
  ["Un dibujo enmarcado hecho por vos","🖼️","PA","KE"],
  ["Una taza con tu propia cara","☕","MI","ME"],
  ["Un libro en francés","📕","OS","RY"],
  ["Una broma envuelta en cinco cajas, una dentro de otra","📦","JI","ME"],
  ["Una caja de bombones ya abierta, \u201cpara probarlos\u201d","🍫","KE","MI"]]},
 {q:"¿Dónde te gusta trabajar?", c:"#A9BCE0", o:[
  ["Mirando a la puerta, por si hay un ataque","🚪","DW","OS"],
  ["En el centro de la oficina, donde todos puedan verte trabajar (o verte, en general)","👀","MI","RY"],
  ["En un rincón con plantas, donde nadie te pida nada","🪴","PA","TO"],
  ["Donde haya alguien a quien molestar","📎","JI","MI"],
  ["En una biblioteca, en silencio absoluto y juzgando al que hace ruido","📚","OS","DW"],
  ["A menos de tres metros de la heladera","🧊","KE","ME"]]},
 {q:"¿Qué foto ponés en tu perfil de Tinder?", c:"#F2A7B8", o:[
  ["Una selfie en el auto, con lentes de sol y pose de jefe","🕶️","MI","RY"],
  ["Posando orgulloso con un animal de granja","🐄","DW","KE"],
  ["Una foto espontánea, riéndote y medio desenfocada","😂","JI","PA"],
  ["En un taller, con las manos manchadas de pintura","🎨","PA","OS"],
  ["Frente a un museo europeo, copa de vino en mano","🍷","OS","RY"],
  ["Una foto borrosa de fiesta a las 4 a. m.","🥳","ME","MI"]]},
 {q:"Domingo, 19 h. ¿Dónde estás?", c:"#C9B6E4", o:[
  ["Armando una broma con cinta y papel de regalo","🎁","JI","PA"],
  ["Recorriendo una muestra en un museo","🏛️","OS","JI"],
  ["Planeando tu próximo emprendimiento en LinkedIn","💼","RY","DW"],
  ["En el sofá, con manta y una montaña de snacks","🛋️","KE","JI"],
  ["En un after con luces de boliche","🪩","ME","KE"],
  ["Con una película triste y una caja de pañuelos","🎬","TO","PA"]]},
 {q:"Te ganás 10.000 dólares. ¿En qué los gastás?", c:"#B5D98A", o:[
  ["Un búnker lleno de latas de conserva","🥫","DW","TO"],
  ["Materiales de arte","🖌️","PA","OS"],
  ["Un viaje a la ópera en Viena","🎭","OS","RY"],
  ["Fichas de casino","🎰","KE","ME"],
  ["Una cena para toda la oficina, invitás vos","🍝","MI","KE"],
  ["Una valija armada y un pasaje a cualquier lado","🧳","JI","MI"]]},
 {q:"Te gusta alguien. ¿Qué hacés?", c:"#F4B48C", o:[
  ["Una declaración pública, con globos y un cartel con su nombre","🎈","MI","DW"],
  ["La hacés reír todos los días","☕","JI","PA"],
  ["Le proponés un contrato de relación con cláusulas","📜","DW","OS"],
  ["Le hacés un dibujo que nunca le vas a dar","✏️","PA","TO"],
  ["Tenés cinco chats abiertos a la vez","💬","RY","ME"],
  ["La mirás de lejos, en silencio","🌧️","TO","PA"]]},
 {q:"Te toca organizar una fiesta. ¿Cómo es?", c:"#F7D56A", o:[
  ["Temática: vos. Con karaoke","🎤","MI","ME"],
  ["Decoración hecha a mano hasta las 3 a. m.","✂️","PA","KE"],
  ["Cena de pasos con maridaje","🥂","OS","RY"],
  ["Con lista de invitados verificada y plan de evacuación","📋","DW","OS"],
  ["Barra libre, y nadie se acuerda de cómo terminó","🍹","ME","JI"],
  ["Con cierre a las 22 h, por respeto a los vecinos","🕙","TO","DW"]]}
];

const PRIMARY = 2, SECONDARY = 1;
function scoreFrom(ans){
  const s = {}, p = {};
  ORDER.forEach(k => { s[k] = 0; p[k] = 0; });
  ans.forEach((a, i) => {
    if (a == null) return;
    const [, , pri, sec] = Q[i].o[a];
    s[pri] += PRIMARY; p[pri] += 1; s[sec] += SECONDARY;
  });
  const ranked = [...ORDER].sort((a, b) => s[b] - s[a] || p[b] - p[a] || ORDER.indexOf(a) - ORDER.indexOf(b));
  return { s, ranked };
}

// ---------- Cierre grupal: diagnóstico de la oficina ----------
const DIAG = {
  DW: ["Régimen de seguridad", "Esta oficina tiene protocolo para todo, incluido el protocolo. Hay un plan de evacuación que nadie pidió y alguien ya está anotando quién llegó tarde."],
  JI: ["Productividad opcional", "Acá se trabaja lo justo y se bromea lo necesario. Nadie sabe bien en qué está el otro, pero todos saben quién escondió la abrochadora."],
  MI: ["Caos con buenas intenciones", "Esta oficina es una reunión que podría haber sido un mail, con karaoke incluido. Mucho cariño, cero agenda y un discurso a punto de empezar."],
  PA: ["La oficina sensible", "Acá alguien se acuerda de los cumpleaños, alguien decora y todos se guardan lo que piensan. Funciona, pero con muchas cosas sin decir."],
  OS: ["El club de los que tienen razón", "Toda conversación termina con un dato corregido. Es la oficina más culta y la más agotadora para discutir sobre cualquier cosa."],
  KE: ["El área de catering", "Las reuniones se miden por lo que hay para picar. Productividad baja, felicidad alta, y siempre falta pan."],
  RY: ["Startup sin producto", "Muchas ideas disruptivas, ninguna entregada. Esta oficina tiene más tarjetas personales que clientes."],
  ME: ["After office permanente", "Nadie recuerda bien cómo terminó la última reunión. Lo que pasa en esta oficina queda en esta oficina, si alguien se acuerda."],
  TO: ["Recursos Humanos en pleno", "La oficina más sensata y la menos escuchada. Hay un reglamento para todo y nadie lo leyó."],
};
const DIAG_TWIST = {
  DW: "alguien está armando un búnker por las dudas.",
  JI: "hay una broma en preparación ahora mismo.",
  MI: "en cualquier momento alguien arranca un discurso.",
  PA: "alguien dibuja en silencio mientras los demás discuten.",
  OS: "alguien está a punto de decir «en realidad…».",
  KE: "la heladera es zona compartida, pero no tanto.",
  RY: "alguien acaba de lanzar un emprendimiento.",
  ME: "la reunión siempre termina en el bar.",
  TO: "alguien ya está escribiendo un informe sobre esto.",
};
const DIAG_BALANCED = ["Oficina sin dueño", "No manda nadie y opina todo el mundo. Hay un poco de cada personaje, que es la receta exacta para que una reunión no termine nunca."];
