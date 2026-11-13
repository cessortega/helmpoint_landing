/* HelmPoint landing — motor de plantillas mínimo (sin dependencias).
   Sintaxis: {{ ruta }} en texto y atributos, <sc-if value="{{ x }}">, <sc-for list="{{ xs }}" as="it">, onclick/onsubmit/onchange="{{ fn }}". */
(function(){
const HOLE=/\{\{\s*([\w.$]+)\s*\}\}/g;
function get(scope,path){
  if(path==='true')return true;if(path==='false')return false;
  let v=scope;for(const k of path.split('.')){if(v==null)return undefined;v=v[k]}return v;
}
function single(str){const m=/^\{\{\s*([\w.$]+)\s*\}\}$/.exec(str.trim());return m?m[1]:null}
function interp(str,scope){return str.replace(HOLE,(_,p)=>{const v=get(scope,p);return v==null?'':String(v)})}
const EVT={onclick:'click',onsubmit:'submit',onchange:'input',oninput:'input'};

function compile(root,binds){
  // root: Node (element or fragment). Walk children; returns nothing, pushes bindings.
  const kids=Array.from(root.childNodes);
  for(const node of kids){
    if(node.nodeType===3){
      if(!HOLE.test(node.data)){HOLE.lastIndex=0;continue}
      HOLE.lastIndex=0;
      const frag=document.createDocumentFragment();let last=0,m;const re=/\{\{\s*([\w.$]+)\s*\}\}/g;
      while((m=re.exec(node.data))){
        if(m.index>last)frag.appendChild(document.createTextNode(node.data.slice(last,m.index)));
        const span=document.createElement('span');span.style.display='contents';frag.appendChild(span);
        const path=m[1];let prev;
        binds.push(scope=>{const v=get(scope,path);if(v===prev)return;prev=v;
          if(typeof v==='string'&&v.startsWith('<svg'))span.innerHTML=v;else span.textContent=v==null?'':String(v)});
        last=re.lastIndex;
      }
      if(last<node.data.length)frag.appendChild(document.createTextNode(node.data.slice(last)));
      node.parentNode.replaceChild(frag,node);
      continue;
    }
    if(node.nodeType!==1)continue;
    const tag=node.tagName.toLowerCase();
    if(tag==='sc-if'||tag==='sc-for'){
      const anchor=document.createComment(tag);node.parentNode.replaceChild(anchor,node);
      const tplFrag=document.createDocumentFragment();while(node.firstChild)tplFrag.appendChild(node.firstChild);
      if(tag==='sc-if'){
        const path=single(node.getAttribute('value'));let inst=null;
        binds.push(scope=>{const on=!!get(scope,path);
          if(on&&!inst){inst=instance(tplFrag);anchor.parentNode.insertBefore(inst.frag,anchor.nextSibling);}
          else if(!on&&inst){inst.nodes.forEach(n=>n.remove());inst=null}
          if(inst)inst.update(scope)});
      } else {
        const path=single(node.getAttribute('list')),as=node.getAttribute('as');const insts=[];
        binds.push(scope=>{const list=get(scope,path)||[];
          list.forEach((item,i)=>{const sc=Object.assign(Object.create(scope),{[as]:item,$index:i});
            if(!insts[i]){const inst=instance(tplFrag);const prevNodes=i?insts[i-1].nodes:null;
              const after=prevNodes&&prevNodes.length?prevNodes[prevNodes.length-1]:anchor;
              after.parentNode.insertBefore(inst.frag,after.nextSibling);insts[i]=inst}
            insts[i].update(sc)});
          while(insts.length>list.length)insts.pop().nodes.forEach(n=>n.remove())});
      }
      continue;
    }
    for(const at of Array.from(node.attributes)){
      if(at.value.indexOf('{{')<0)continue;
      const name=at.name,val=at.value,p=single(val);node.removeAttribute(name);
      if(EVT[name]&&p){let cur;node.addEventListener(EVT[name],e=>{if(typeof cur==='function')cur(e)});binds.push(scope=>{cur=get(scope,p)});continue}
      let prev={};
      binds.push(scope=>{const v=p?get(scope,p):interp(val,scope);if(v===prev)return;prev=v;
        if(name==='value'){if(node.value!==String(v??''))node.value=v??''}
        else if(name==='checked'||name==='disabled'){node[name]=!!v}
        else if(name==='class'){node.className=v??''}
        else if(v===false||v==null)node.removeAttribute(name);
        else node.setAttribute(name,v)});
    }
    compile(node,binds);
  }
}
function instance(tplFrag){
  const wrap=document.createElement('div');wrap.style.display='contents';
  wrap.appendChild(tplFrag.cloneNode(true));const binds=[];compile(wrap,binds);
  const frag=document.createDocumentFragment();frag.appendChild(wrap);
  return {frag,nodes:[wrap],update(scope){for(const b of binds)b(scope)}};
}

class DCLogic{constructor(){this.props={};this.state={}}
  setState(o){const patch=typeof o==='function'?o(this.state):o;this.state=Object.assign({},this.state,patch);this.__render&&this.__render()}
  forceUpdate(){this.__render&&this.__render()}}
window.DCLogic=DCLogic;

const ic=(n,s,sw)=>window.HPIc?window.HPIc(n,s||20,sw):null;
const WORDS=['visitas','inspecciones','instalaciones','mantenimientos','entregas'];
const SEQ=[['Check-in','Dentro de la geocerca','pin'],['Checklist','12 preguntas','form'],['Fotos','Mínimo 3','camera'],['Firma','Quien recibe','sign'],['Autorización','Supervisor','shield']];
const HOOKS=[['activity.created','84 ms'],['activity.checkin','61 ms'],['form.submitted','92 ms'],['evidence.uploaded','140 ms'],['activity.review','73 ms'],['activity.closed','58 ms']];
const BRANDS=[['Grupo Norte','GN','#0EA5E9','gruponorte'],['Clínica Vidamed','CV','#15A34A','vidamed'],['Acme Servicios','AS','#E8670C','acme'],['Patito SA','PS','#7C3AED','patito']];
const PST=[['Asignada','#F2F3F6','#4B4C58','#9CA3AF','4%'],['En curso','#F3EEFF','#5B21B6','#7C3AED','25%'],['En curso','#F3EEFF','#5B21B6','#7C3AED','50%'],['En curso','#F3EEFF','#5B21B6','#7C3AED','75%'],['En curso','#F3EEFF','#5B21B6','#7C3AED','92%'],['Cerrada','#E4F5E9','#11753A','#15A34A','100%']];

const MAIL='admin@helmdeck.ai';
const LEGAL={
  t:{title:'Términos de uso',ver:'v 1.0',date:'Actualizado 12 nov 2026',
    sum:[['info','La información del sitio es general','Precios y funciones son de referencia; lo que aplica es lo que firmemos en tu contrato.'],['form','Pedir una demo no te compromete','Solo nos da permiso de contactarte para mostrarte HelmPoint.'],['tag','Marcas de terceros, de sus dueños','Claude, ChatGPT, WhatsApp y Excel pertenecen a sus respectivas empresas.']],
    secs:[
      ['Quiénes somos',['HelmPoint es una plataforma operada por Helmdeck, S.A.S., sociedad mexicana con domicilio en Calle Emilio Carranza 16, interior 17, Col. Ampliación San Pedro Xalpa, Alcaldía Azcapotzalco, C.P. 02719, Ciudad de México. Estos términos regulan el uso de este sitio web.','El uso de la plataforma HelmPoint por parte de empresas clientes se rige por su propio contrato y por los Términos y Condiciones que se aceptan dentro del panel.']],
      ['Uso del sitio',['Puedes navegar, consultar información y solicitar una demo. No está permitido intentar acceder a sistemas sin autorización, interferir con el funcionamiento del sitio ni usarlo para fines ilícitos.']],
      ['Solicitudes de demo y contacto',['Al enviar el formulario nos autorizas a contactarte por correo, teléfono o WhatsApp para agendar la demo y darte seguimiento comercial.','Pedir una demo no genera ninguna obligación de compra.']],
      ['Precios e información comercial',['Los precios publicados son de referencia, en pesos mexicanos y antes de impuestos. Pueden cambiar sin previo aviso.','Las condiciones definitivas (precio, usuarios, alcance y niveles de servicio) son las que se establezcan en la propuesta o contrato firmado.']],
      ['Propiedad intelectual',['La marca HelmPoint, su logotipo, el diseño del sitio y sus contenidos son propiedad de Helmdeck, S.A.S. No pueden usarse sin autorización por escrito.']],
      ['Integraciones y marcas de terceros',['HelmPoint puede conectarse con servicios de terceros como Claude, ChatGPT, WhatsApp o Excel. Esas marcas pertenecen a sus dueños y su uso se rige por los términos de cada proveedor.']],
      ['Limitación de responsabilidad',['El sitio se ofrece “tal cual”. Hacemos lo posible por que la información sea correcta y esté disponible, pero no garantizamos que esté libre de errores o interrupciones.']],
      ['Ley aplicable',['Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia se resolverá ante los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero.']],
      ['Cambios a estos términos',['Podemos actualizar estos términos. La versión vigente siempre estará en esta página, con su fecha de actualización.']]],
    foot:'Al usar este sitio aceptas estos Términos de uso.'},
  p:{title:'Aviso de Privacidad',ver:'v 1.0',date:'Actualizado 12 nov 2026',
    sum:[['shield','Cuidamos tus datos','En Helmdeck somos responsables de lo que haces en este sitio y los tratamos con respeto.'],['users','Solo datos de contacto','Nombre, correo de trabajo, empresa y tamaño de tu equipo. Nada sensible.'],['key','Tus derechos ARCO','Acceder, rectificar, cancelar u oponerte escribiéndonos; respondemos en 20 días hábiles.']],
    secs:[
      ['Responsable',['Helmdeck, S.A.S., con domicilio en Calle Emilio Carranza 16, interior 17, Col. Ampliación San Pedro Xalpa, Alcaldía Azcapotzalco, C.P. 02719, Ciudad de México, es responsable del tratamiento de los datos personales que nos compartes a través de este sitio, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.','Contacto de privacidad: '+MAIL+'.']],
      ['Datos que recabamos',['Del formulario de demo: nombre, correo de trabajo, empresa y número aproximado de personas en campo.','Al navegar: datos técnicos como tipo de navegador, páginas visitadas y dirección IP aproximada. No recabamos datos personales sensibles.']],
      ['Para qué los usamos',['Finalidades necesarias: atender tu solicitud de demo, contactarte y darte seguimiento comercial, y preparar una propuesta.','Finalidades adicionales: enviarte novedades de HelmPoint y encuestas de satisfacción. Si no quieres que usemos tus datos para esto, escríbenos a '+MAIL+'; no afecta la atención de tu solicitud.']],
      ['Con quién los compartimos',['No vendemos ni rentamos tus datos. Solo los comparten con nosotros proveedores que nos dan servicios de hospedaje, correo y gestión comercial, bajo obligaciones de confidencialidad.','Algunos de estos proveedores pueden estar fuera de México; en esos casos les exigimos el mismo nivel de protección.']],
      ['Cookies',['Usamos cookies técnicas para que el sitio funcione y, en su caso, de analítica para entender cómo se usa. Puedes desactivarlas desde la configuración de tu navegador.']],
      ['Derechos ARCO y revocación',['Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos, o revocar tu consentimiento, enviando una solicitud a '+MAIL+' con tu nombre, el derecho que quieres ejercer e identificación.','Te responderemos en un máximo de 20 días hábiles.']],
      ['Conservación',['Guardamos tus datos de contacto mientras exista una relación comercial o hasta que nos pidas eliminarlos, salvo que la ley nos obligue a conservarlos por más tiempo.']],
      ['Cambios al aviso',['Cualquier cambio a este aviso se publicará en esta página con su fecha de actualización.']]],
    foot:'Al enviar tus datos en este sitio confirmas que leíste este Aviso de Privacidad.'}
};
class Component extends DCLogic {
  state={t:0,annual:false,faq:0,name:'',mail:'',size:null,useCase:'',sending:false,error:'',sent:false,lgOpen:false,lgTab:'p',lgSec:0};
  componentDidMount(){
    let th='light';try{th=localStorage.getItem('helmpoint-theme')||th}catch(e){}document.documentElement.dataset.theme=th;
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._esc=e=>{if(e.key==='Escape'&&this.state.lgOpen)this.setState({lgOpen:false})};window.addEventListener('keydown',this._esc);
    if(!reduce)this._iv=setInterval(()=>this.setState(s=>({t:s.t+1})),1500);
    const els=()=>Array.from(document.querySelectorAll('.rv:not(.in)'));
    if('IntersectionObserver' in window&&!reduce){
      this._io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');this._io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
      this._scan=setTimeout(()=>els().forEach(el=>this._io.observe(el)),60);
    } else els().forEach(el=>el.classList.add('in'));
  }
  componentWillUnmount(){window.removeEventListener('keydown',this._esc);clearInterval(this._iv);clearTimeout(this._scan);this._io&&this._io.disconnect()}
  renderVals(){
    const s=this.state,set=o=>this.setState(o),t=s.t;
    const I={checkXs:ic('check',12,3.2),checkSm:ic('check',16,2.8),checkLg:ic('check',40,3),x:ic('x',14,2.6),arrowR:ic('arrowR',18,2.2),arrowRs:ic('arrowR',14,2.2),play:ic('play',12,2.6),plusSm:ic('plus',16,2.6),
      bell:ic('bell',18,2.2),shieldSm:ic('shield',15,2.2),sparkleSm:ic('sparkle',15,2.2),mailSm:ic('send',14,2.2),lockSm:ic('lock',14,2.2),formSm:ic('form',15,2.2),mobileSm:ic('mobile',15,2.2),layersSm:ic('layers',15,2.2),sendSm:ic('send',15,2.2),buildingSm:ic('building',15,2.2),chevD:ic('chevD',20,2.2)};
    // Héroe: flujo de 6 etapas
    const stg=t%6, ps=PST[stg];
    const pSteps=['Check-in','Formulario','Fotos','Firma'].map((x,i)=>{const on=i===stg-1;return {t:x,bg:stg===5||i<stg-1?'#15A34A':on?'#7C3AED':'#E8E9EE',fg:on?'#5B21B6':(stg===5||i<stg-1)?'#11753A':'#9CA3AF'}});
    // MCP chat
    const cp=t%5;
    // MFA
    const code='482913',n=Math.min(t%9,6);
    // Formularios
    const yes=Math.floor(t/2)%2===0;
    // Offline
    const op=t%4;
    const OFF=[
      {t:'Sin conexión',s:'Todo se guarda en el teléfono',ic:ic('x',18,2.6),icBg:'var(--warn-soft)',icFg:'var(--warn-ink)',w:'0%',c:'var(--warn)',spin:''},
      {t:'Sin conexión',s:'4 elementos listos para enviar',ic:ic('x',18,2.6),icBg:'var(--warn-soft)',icFg:'var(--warn-ink)',w:'0%',c:'var(--warn)',spin:''},
      {t:'Conexión recuperada',s:'Enviando al panel…',ic:ic('refresh',18,2.4),icBg:'var(--accent-soft)',icFg:'var(--accent-ink)',w:'60%',c:'var(--accent)',spin:'spin'},
      {t:'Todo enviado',s:'Ya aparece en tu panel',ic:ic('check',18,2.8),icBg:'var(--ok-soft)',icFg:'var(--ok-ink)',w:'100%',c:'var(--ok)',spin:''}][op];
    OFF.items=['Check-in','Respuestas','3 fotos','Firma'].map((x,i)=>{const sent=op===3||(op===2&&i<2);const hidden=op===0&&i===3;return {t:(sent?'✓ ':'')+x,bg:hidden?'transparent':sent?'var(--ok-soft)':'var(--surface-2)',fg:hidden?'transparent':sent?'var(--ok-ink)':'var(--text-2)'}});
    // Secuencia
    const sq=t%6;
    // Webhooks
    const hk=[0,1,2,3].map(i=>HOOKS[(t+6-i)%6]);
    // Marca
    const bi=Math.floor(t/2)%4;
    const PN=s.annual?[225,325]:[270,390];
    const P=PN.map(v=>'$'+v);
    const Y=s.annual?PN.map(v=>'$'+(v*12).toLocaleString('en-US')+' MXN / año por usuario'):['',''];
    return {
      I,
      links:[['Producto','#producto'],['Lo nuevo','#nuevo'],['Precios','#precios'],['Preguntas','#faq']].map(([t,href])=>({t,href})),
      words:WORDS.map(t=>({t})),wordY:'-'+(Math.floor(t/2)%WORDS.length*1.1)+'em',
      heroProof:[['Funciona sin señal','mobile'],['iOS y Android','check'],['MFA incluido','shield'],['Claude y ChatGPT','sparkle']].map(([t,i])=>({t,ic:ic(i,15,2.4)})),
      netC:stg===3?'#C2780A':'#111118',net:stg===3?'Sin red':'5G',
      st0:stg===0,st1:stg===1,st2:stg===2,st3:stg===3,st4:stg===4,st5:stg===5,
      pSteps,
      phoneInfo:[['pin','Av. Constitución 1200, Monterrey'],['clock','Ventana 09:00 – 10:00'],['form','4 pasos · checklist, fotos y firma']].map(([i,t])=>({t,ic:ic(i==='clock'?'cal':i,15,2.2)})),
      formQs:[['¿El área está despejada?',0,0],['¿El equipo enciende?',1,0],['¿Hay fuga visible?',2,22],['Lectura del medidor',3,22]].map(([q,i,ml])=>({t:q,dl:(i*.18)+'s',ml:ml+'px',yBg:i<3?'#7C3AED':'#F2F3F6',yFg:i<3?'#FFFFFF':'#7E7F8C'})),
      photos:[['Tablero','linear-gradient(135deg,#A78BFA,#6D28D9)'],['Medidor','linear-gradient(135deg,#7DD3FC,#2563EB)'],['Placa','linear-gradient(135deg,#FCD34D,#EA580C)'],['Antes / después','linear-gradient(135deg,#86EFAC,#15803D)']].map(([t,bg],i)=>({t,bg,dl:(i*.2)+'s'})),
      pnl:{st:ps[0],bg:ps[1],fg:ps[2],c:ps[3],w:ps[4],bd:stg===5?'#86D9A4':stg>0?'#C9B6FA':'#ECEBF2'},
      panelRows:[['Instalación · Oxxo Gonzalitos','Cerrada','#E4F5E9','#11753A'],['Reporte de falla · Vidamed','Asignada','#F2F3F6','#4B4C58']].map(([t,st,bg,fg])=>({t,st,bg,fg})),
      industries:[...Array(2)].flatMap(()=>[['Mantenimiento','checks'],['Instalaciones','hash'],['Inspección','listSearch'],['Soporte técnico','tri'],['Entregas','send'],['Levantamientos','pin'],['Limpieza','sparkle'],['Seguridad','shield'],['Telecom','globe'],['Salud','users']]).map(([t,i])=>({t,ic:ic(i,16,2.2)})),
      before:['Pides fotos y ubicación por WhatsApp, una por una.','No sabes si tu equipo de verdad llegó al sitio.','Copias todo al Excel al final del día.','El cliente pregunta y nadie tiene la respuesta.'].map(t=>({t})),
      after:['Avisos automáticos por WhatsApp a tu equipo y a tu cliente.','Check-in con GPS y geocerca del sitio.','Exporta a Excel cuando lo necesites, ya con todo capturado.','Reporte PDF con fotos y firma, por correo o WhatsApp.'].map(t=>({t})),
      scopes:['OAuth 2.0','mcp:read','mcp:write','Revocable'].map(t=>({t})),
      ask:'¿Cómo va el equipo hoy? ¿Algo pendiente de autorizar?',
      chatTyping:cp===1,chatAnswer:cp>=2,chatAction:cp===4,
      ansRows:[['ACT-2048','Plaza Fiesta','Por autorizar'],['ACT-2055','Oxxo Lincoln','Por autorizar']].map(([id,t,st],i)=>({id,t,st,dl:(.15+i*.15)+'s'})),
      otp:code.split('').map((d,i)=>({d:i<n?d:'',bd:n===6?'var(--ok)':i===n?'var(--accent)':i<n?'var(--line-2)':'var(--line)',bg:n===6?'var(--ok-soft)':i===n?'var(--accent-soft)':'var(--surface)'})),
      otpOk:n===6,otpWait:n<6,
      brYes:yes,brNo:!yes,yesBg:yes?'var(--accent)':'transparent',yesFg:yes?'#FFFFFF':'var(--text-3)',noBg:!yes?'var(--warn)':'transparent',noFg:!yes?'#FFFFFF':'var(--text-3)',
      off:OFF,
      seq:SEQ.map(([x,sub,i],k)=>{const done=k<sq,on=k===sq;return {t:x,s:sub,ic:done?ic('check',14,3):ic(i,14,2.2),bg:done?'var(--ok)':on?'var(--accent)':'var(--surface-2)',fg:done||on?'#FFFFFF':'var(--text-3)',sh:on?'0 0 0 6px var(--accent-soft)':'none',line:k===SEQ.length-1?'transparent':done?'var(--ok)':'var(--line)',tc:done||on?'var(--text)':'var(--text-3)'}}),
      mailA:t%2===0,mailB:t%2===1,
      hooks:hk.map(([x,ms],i)=>({t:x,ms,bg:i===0?'rgba(124,58,237,.35)':'rgba(255,255,255,.05)',op:1-i*.2})),
      brands:BRANDS.map(([x,ini,c],i)=>{const on=i===bi;return {t:x,ini,c,bg:on?'var(--surface)':'transparent',fg:on?'var(--text)':'var(--text-3)',bd:on?c:'transparent'}}),
      kpis:[['92%','Llegada a tiempo','+4 pts vs. mes pasado'],['48 min','Duración promedio','−6 min'],['88%','Aprobadas a la primera','+2 pts'],['26 h','En sitio esta semana','+3 h']].map(([v,l,d])=>({v,l,d})),
      bars:[['L',62],['M',78],['M',55],['J',96],['V',84],['S',48],['D',30]].map(([l,v],i)=>({l,h:v+'%',dl:(-i*.37)+'s',bg:i===3?'linear-gradient(180deg,#C8F25C,#84CC16)':'linear-gradient(180deg,#A78BFA,#6D28D9)'})),
      billing:[[false,'Mensual'],[true,'Anual']].map(([a,t])=>{const on=s.annual===a;return {t,save:a,aria:on?'true':'false',on:()=>set({annual:a}),bg:on?'var(--surface)':'transparent',fg:on?'var(--text)':'var(--text-2)',sh:on?'var(--shadow-sm)':'none'}}),
      plans:[
        ['Inicial','Para empezar a ordenar tu operación.',P[0],'MXN / usuario / mes',Y[0],['App para tu equipo en campo','Hasta 3 tipos de actividad','Formularios, fotos y firma','Reporte PDF y exportar a Excel','MFA incluido'],'Solicitar demo',false],
        ['Pro','Para equipos que entregan reportes a sus clientes.',P[1],'MXN / usuario / mes',Y[1],['Todo lo de Inicial','Formularios anidados ilimitados','Autorizar y rechazar','Avisos por correo y WhatsApp','Conecta Claude o ChatGPT (MCP)'],'Solicitar demo',true],
        ['Empresa','Para operaciones con varias empresas o regiones.','Hablemos','','',['Todo lo de Pro','Multiempresa con tu marca','Webhooks e integraciones','Soporte prioritario','Soporte a la medida'],'Contactar ventas',false]
      ].map(([name,desc,price,unit,yearly,items,cta,pop])=>({name,desc,price,unit,yearly,pop,cta,items:items.map(t=>({t})),bg:pop?'linear-gradient(160deg,#8B5CF6,#5B21B6)':'var(--surface)',fg:pop?'#FFFFFF':'var(--text)',border:pop?'0':'1px solid var(--line)',sh:pop?'0 40px 70px -30px #7C3AED':'none',chkBg:pop?'#C8F25C':'var(--ok-soft)',chkFg:pop?'#1C2405':'var(--ok-ink)',btnBg:pop?'#FFFFFF':'var(--ink)',btnFg:pop?'#5B21B6':'var(--on-ink)'})),
      faqs:[
        ['¿Funciona si mi equipo no tiene señal?','Sí. La app guarda check-in, respuestas, fotos y firma en el teléfono y los envía sola en cuanto recupera conexión.'],
        ['¿Cómo se conecta con Claude o ChatGPT?','HelmPoint tiene un servidor MCP. Lo conectas a Claude o ChatGPT con tu cuenta, autorizas los permisos y puedes preguntarle por tus actividades, pedirle resúmenes o crear asignaciones. Puedes revocar el acceso cuando quieras.'],
        ['¿Cómo protegen el acceso?','Verificación en dos pasos (MFA) con app autenticadora, roles con permisos por sección y sesiones que puedes cerrar desde el panel.'],
        ['¿Necesito programar para crear formularios?','No. Los armas con un constructor visual, incluso con preguntas Sí/No que abren otras preguntas adentro.'],
        ['¿Mi cliente necesita una cuenta?','No. Recibe un correo al iniciar y otro al cerrar, con el reporte PDF adjunto.'],
        ['¿Puedo conectarlo con mi sistema?','Sí. Con webhooks recibes cada evento de la actividad en tu servidor, firmado para que sepas que viene de HelmPoint.']
      ].map(([q,a],i)=>{const open=s.faq===i;return {q,a,open,aria:open?'true':'false',on:()=>set({faq:open?null:i}),rot:open?'rotate(45deg)':'none',nBg:open?'var(--accent)':'var(--surface-2)',nFg:open?'#FFFFFF':'var(--text-3)',div:i?'1px solid var(--line)':'0'}}),
      demoPts:['Demo en vivo con tu propio flujo','Configuración inicial incluida','Sin tarjeta de crédito'].map(t=>({t})),
      name:s.name,mail:s.mail,useCase:s.useCase,onName:e=>set({name:e.target.value}),onMail:e=>set({mail:e.target.value}),onUseCase:e=>set({useCase:e.target.value}),
      sizes:['1–5','6–20','21–50','50+'].map(x=>{const on=s.size===x;return {t:x,aria:on?'true':'false',on:()=>set({size:x}),border:on?'1.5px solid #7C3AED':'1px solid #D6D8DF',bg:on?'#F3EEFF':'#FFFFFF',fg:on?'#5B21B6':'#4B4C58'}}),
      blocked:s.sending||!s.name.trim()||!/^\S+@\S+\.\S+$/.test(s.mail)||!s.size,
      blockedOpacity:(s.sending||!s.name.trim()||!/^\S+@\S+\.\S+$/.test(s.mail)||!s.size)?'.6':'1',
      sending:s.sending,error:s.error,hasError:!!s.error,
      submitLabel:s.sending?'Enviando…':'Agendar demo',
      submit:async e=>{e.preventDefault();if(s.sending)return;
        set({sending:true,error:''});
        try{
          const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({name:s.name.trim(),email:s.mail.trim(),size:s.size,useCase:s.useCase.trim()})});
          const d=await r.json().catch(()=>({}));
          if(r.ok&&d.ok)set({sent:true,sending:false});
          else set({sending:false,error:d.error||'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos a '+MAIL+'.'});
        }catch(_){set({sending:false,error:'No hay conexión. Intenta de nuevo o escríbenos a '+MAIL+'.'})}
      },
      sent:s.sent,notSent:!s.sent,firstName:(s.name.trim().split(' ')[0]||''),
      openPriv:e=>{e&&e.preventDefault();set({lgOpen:true,lgTab:'p',lgSec:0})},openTerms:e=>{e&&e.preventDefault();set({lgOpen:true,lgTab:'t',lgSec:0})},
      lg:(()=>{const d=LEGAL[s.lgTab];return {open:s.lgOpen,mail:MAIL,close:()=>set({lgOpen:false}),
        tabs:[['t','Términos de uso'],['p','Aviso de Privacidad']].map(([k,x])=>{const on=s.lgTab===k;return {t:x,aria:on?'true':'false',on:()=>set({lgTab:k,lgSec:0}),bg:on?'var(--surface)':'transparent',fg:on?'var(--text)':'var(--text-2)',sh:on?'var(--shadow-sm)':'none'}}),
        d:{title:d.title,ver:d.ver,date:d.date,foot:d.foot,sum:d.sum.map(([i,x,dd])=>({ic:ic(i,17,2.2),t:x,d:dd})),
          secs:d.secs.map(([x,ps],k)=>{const open=s.lgSec===k;return {n:String(k+1).padStart(2,'0'),t:x,open,aria:open?'true':'false',on:()=>set({lgSec:open?null:k}),rot:open?'rotate(180deg)':'none',bd:open?'color-mix(in srgb, var(--accent) 35%, var(--line))':'var(--line)',ps:ps.map(t=>({t}))}})}}})(),
      footCols:[['Producto',[['App de campo','#producto'],['Lo nuevo','#nuevo'],['Precios','#precios']]],['Empresa',[['Contacto','#demo'],['Preguntas','#faq'],['Iniciar sesión','#']]],['Legal',[['Aviso de Privacidad','#','p'],['Términos de uso','#','t']]]].map(([t,items])=>({t,items:items.map(([x,h,lk])=>({t:x,h,on:lk?(e=>{e.preventDefault();set({lgOpen:true,lgTab:lk,lgSec:0})}):(()=>{})}))}))
    };
  }
}

function boot(){
  const app=document.getElementById('app'),tpl=document.getElementById('tpl');
  const c=new Component();
  const inst=instance(tpl.content);
  let queued=false;
  const render=()=>inst.update(c.renderVals());
  c.__render=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;render()})};
  render();app.appendChild(inst.frag);
  c.componentDidMount&&c.componentDidMount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
