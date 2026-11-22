/* HelmPoint landing — motor de plantillas mínimo (sin dependencias).
   Sintaxis: {{ ruta }} en texto y atributos, <sc-if value="{{ x }}">, <sc-for list="{{ xs }}" as="it">, <sc-use tpl="id" with="{{ x }}">, onclick/onsubmit/onchange="{{ fn }}". */
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
    if(tag==='sc-use'){ // parcial: <sc-use tpl="id" with="{{ ruta }}"> → la plantilla ve el dato como `v`
      const t=document.getElementById(node.getAttribute('tpl')),path=single(node.getAttribute('with'));
      const inst=instance(t.content);node.parentNode.replaceChild(inst.frag,node);
      binds.push(scope=>inst.update(Object.assign(Object.create(scope),{v:get(scope,path)})));
      continue;
    }
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
    sum:[['shield','Helmdeck, S.A.S. es responsable','Nosotros decidimos cómo se usan los datos que dejas en este sitio.'],['users','Solo datos de contacto','Nombre, correo de trabajo, empresa y tamaño de tu equipo. Nada sensible.'],['key','Tus derechos ARCO','Acceder, rectificar, cancelar u oponerte escribiéndonos; respondemos en 20 días hábiles.']],
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
// Pantallas de la app: colores y textos tomados de la app móvil (AppColors.light) y de la vista previa del panel.
const AC={p:'#8B5CF6',pd:'#5B2FC9',ps:'#EDE4FE',mut:'#6B675E',dis:'#9A978F',ok:'#2E8B57',okS:'#DCF5E6',bd:'#EAECF0',bds:'#D6D9E0'};
const STEP={map:['pin','#EDE4FE','#8B5CF6'],form:['form','#EDE4FE','#7C4DEB'],cam:['camera','#E8F0D6','#4F7A3A'],sign:['pen','#EDE4FE','#8B5CF6'],msg:['msg','#FBEFD6','#B07A34']};
// Detalle de la actividad en 6 momentos: 0 asignada · 1-3 en curso (1, 2 y 4 pasos hechos) · 4 en revisión · 5 cerrada.
function detail(k){
  const done=[0,1,2,4,4,4][k],live=k<4,cur=live?[0,1,2,-1][k]:-1;
  const row=(key,t,req,ok,on)=>{const[i,bg,fg]=STEP[key];return{t,ic:ic(i,20,2),icBg:bg,icFg:fg,sub:req?'Obligatorio':'Opcional',hasSub:!ok,ind:ok?ic('eye',17,2.2):ic('chevR',18,2.4),indBg:ok?AC.okS:AC.ps,indFg:ok?AC.ok:AC.pd,bd:on?AC.p:AC.bd,sh:on?'0 0 0 3px '+AC.ps:'none'}};
  const dot=(n,ok)=>({dot:ok?ic('check',13,3.4):n,dotBg:ok?AC.ok:AC.bds,dotFg:ok?'#fff':AC.mut});
  const ks=done<2?'lock':done<4?'open':'done';
  const kid=(key,t,on)=>{const[i,bg,fg]=STEP[key],lk=ks==='lock';return{t,chipIc:ic(i,12,2.2),ic:ic(i,15,2.2),icBg:lk?'#F2F3F5':bg,icFg:lk?AC.dis:fg,fg:lk?AC.mut:'#34312B',end:lk?ic('lock',16,2.2):ks==='done'?ic('eye',16,2.2):ic('chevR',17,2.4),endFg:lk?AC.dis:ks==='done'?AC.ok:AC.pd,bg:on?'#fff':'rgba(255,255,255,.7)',sh:on?'0 0 0 2px '+AC.p:'none'}};
  const blocks=[
    Object.assign(row('map','Ubicación',true,done>=1,cur===0),dot(1,done>=1),{railT:'31px',railB:'0',hasKids:false}),
    Object.assign(row('form','Checklist de mantenimiento',true,done>=2,cur===1),dot(2,done>=2),{railT:'0',railB:'0',hasKids:true,
      kLabel:{lock:'2 PASOS BLOQUEADOS',open:'SE ABRIERON 2 PASOS',done:'2 PASOS COMPLETADOS'}[ks],kIc:ks==='lock'?ic('lock',14,2.2):ks==='done'?ic('check',14,3):ic('chevD',16,2.4),chips:ks==='lock',rows:ks!=='lock',
      kids:[kid('cam','Foto evidencia',cur===2),kid('sign','Firma de recibido',false)]}),
    Object.assign(row('msg','Comentarios',false,false,false),dot(3,false),{railT:'0',railB:'calc(100% - 31px)',hasKids:false})];
  const st=[['ASIGNADA','Lista para iniciar',AC.pd],['EN CURSO','Iniciada hace 2 min',AC.pd],['EN CURSO','Iniciada hace 14 min',AC.pd],['EN CURSO','Iniciada hace 41 min',AC.pd],['EN REVISIÓN','Enviada · esperando autorización','#D96F2E'],['CERRADA','Terminada en 42 min','#4F7A3A']][k];
  return{blocks,chip:st[0],sub:st[1],heroBg:st[2],ini:k?'09:04':'—',fin:k>=4?'09:46':k?'...':'—',pasos:done+'/5',pasosC:done>=4?AC.ok:'#34312B',req:done+' de 4 obligatorios',
    cta:['Empezar: Ubicación','Continuar: Checklist de mantenimiento','Continuar: Foto evidencia','Enviar a revisión','En autorización','Actividad terminada'][k],ctaBg:live?AC.pd:'#E4E6EB',ctaFg:live?'#fff':AC.dis,ctaIc:live?ic('arrowR',18,2.4):'',shift:k===2||k===3?'-48px':'0'};
}
// "Mis actividades" (pestaña Asignadas). push=true: acaba de llegar la actividad nueva.
function listV(push){
  const cards=[['09:00','Mantenimiento preventivo','Aire acondicionado','Hospital San José','En 19 min'],['12:30','Instalación de minisplit','Instalación','Plaza Fiesta Anáhuac','En 3 h 49 min'],['16:00','Reporte de falla','Servicio','Clínica Vidamed','En 7 h 19 min']];
  return{push,n:push?3:2,total:push?4:3,legend:(push?3:2)+' por iniciar',cards:(push?cards:cards.slice(1)).map(([tm,t,tag,c,det],i)=>({tm,t,tag,c,det,bd:push&&!i?AC.p:AC.bd,sh:push&&!i?'0 0 0 3px '+AC.ps:'none'})),
    I:{search:ic('search',18,2.2),filter:ic('filter',17,2.2),play:ic('play',14,2.4),chevD:ic('chevD',18,2.4),bell:ic('bell',18,2.2),cal:ic('cal',20,2),pie:ic('pie',20,2),user:ic('user',20,2),plus:ic('plus',24,2.6),bellN:ic('bell',20,2)}};
}
const sbar=(fg,off)=>({fg,i1:ic(off?'cloudOff':'wifi',14,2.2),i2:off?'':ic('signal',13,2.2),i3:ic('battery',16,2)});
const BADGE={a:['Asignada','#F0ECFE','#4A3AA8'],p:['En curso','#F3EEFF','#5B21B6'],r:['Por autorizar','#FDF1DC','#8A5300'],c:['Cerrada','#E4F5E9','#11753A']};
const bdg=k=>({t:BADGE[k][0],bg:BADGE[k][1],fg:BADGE[k][2]});
class Component extends DCLogic {
  state={feat:0,t:0,annual:false,faq:0,name:'',mail:'',size:null,useCase:'',sending:false,error:'',sent:false,lgOpen:false,lgTab:'p',lgSec:0};
  componentDidMount(){
    let th='light';try{th=localStorage.getItem('helmpoint-theme')||th}catch(e){}document.documentElement.dataset.theme=th;
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._esc=e=>{if(e.key==='Escape'&&this.state.lgOpen)this.setState({lgOpen:false})};window.addEventListener('keydown',this._esc);
    const lh={'#terminos':'t','#privacidad':'p'}[location.hash];if(lh)this.setState({lgOpen:true,lgTab:lh,lgSec:0});
    this._mq=window.matchMedia?window.matchMedia('(max-width:980px)'):{matches:false};
    if(!reduce)this._iv=setInterval(()=>this.setState(x=>{const t=x.t+1;
      // en móvil no hay scroll-spy: el paso avanza solo (cada 4 ticks) salvo que la persona haya tocado uno hace poco
      return this._mq.matches&&t%4===0&&Date.now()-(this._tap||0)>12000?{t,feat:(x.feat+1)%5}:{t}}),2200);
    this._fit=()=>document.querySelectorAll('.fit').forEach(el=>el.style.setProperty('--k',Math.min(+el.dataset.max||1,el.clientWidth/+el.dataset.w).toFixed(4)));
    window.addEventListener('resize',this._fit);window.addEventListener('load',this._fit);setTimeout(this._fit,0);
    const els=()=>Array.from(document.querySelectorAll('.rv:not(.in)'));
    if('IntersectionObserver' in window){
      if(!reduce){this._io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');this._io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});}
      else els().forEach(el=>el.classList.add('in'));
      this._fo=new IntersectionObserver(es=>{if(this._mq.matches)return;es.forEach(e=>{if(e.isIntersecting){const n=+e.target.dataset.feat;if(n!==this.state.feat)this.setState({feat:n})}})},{rootMargin:'-45% 0px -45% 0px',threshold:0});
      this._scan=setTimeout(()=>{if(this._io)els().forEach(el=>this._io.observe(el));document.querySelectorAll('[data-feat]').forEach(el=>this._fo.observe(el))},80);
    } else els().forEach(el=>el.classList.add('in'));
  }
  componentWillUnmount(){clearInterval(this._iv);window.removeEventListener('resize',this._fit);window.removeEventListener('keydown',this._esc);clearTimeout(this._scan);this._io&&this._io.disconnect();this._fo&&this._fo.disconnect()}
  renderVals(){
    const s=this.state,set=o=>this.setState(o),f=s.feat,H=s.t%9;
    const I={checkXs:ic('check',12,3.2),minusSm:ic('minus',16,2.6),clip:ic('form',13,2.2),fMobile:ic('mobile',20,2.2),fSparkle:ic('sparkle',20,2.2),fShield:ic('shield',20,2.2),fCam:ic('camera',20,2.2),fLink:ic('link',20,2.2),link13:ic('link',13,2.4),calW:ic('cal',18,2.2),checkLg:ic('check',36,3),arrowR:ic('arrowR',18,2.2),chevR:ic('chevR',16,2.4),plusSm:ic('plus',16,2.6),bell:ic('bell',18,2.2),sbWifi:ic('wifi',14,2.2),sbSignal:ic('signal',13,2.2),sbBattery:ic('battery',16,2),aChevL:ic('chevL',20,2.2),aMore:ic('more',20,2.2),aTag:ic('tag',15,2.2),aPin:ic('pin',15,2.2),aLock:ic('lock',14,2.2),aBack:ic('chevL',24,2.2),aCheck:ic('check',18,2.6),aX:ic('x',18,2.6),aCheck20:ic('check',20,2.6),aMinus:ic('minus',20,2.4),aPlus:ic('plus',20,2.4),aCam:ic('camera',24,2),aCam14:ic('camera',14,2.2),aPinLg:ic('pin',38,2),aCloudOff:ic('cloudOff',16,2.2),aRefresh:ic('refresh',15,2.4),aForm:ic('form',13,2.2),aPen:ic('pen',13,2.2),grip:ic('grip',14,2),mail:ic('mail',14,2.2),mobile:ic('mobile',13,2.2),monitor:ic('monitor',13,2.2),cal14:ic('cal',14,2.2),chevD14:ic('chevD',14,2.4),plus14:ic('plus',14,2.6),building:ic('building',16,2.2),pinW:ic('pin',16,2.4),x:ic('x',14,2.6),chevD:ic('chevD',20,2.2)};
    const PN=s.annual?[345,499]:[415,599];const P=PN.map(v=>'$'+v);const Y=s.annual?PN.map(v=>'$'+(v*12).toLocaleString('en-US')+' MXN al año'):['',''];
    return {
      I,
      links:[['Cómo funciona','#como'],['Producto','#producto'],['Precios','#precios'],['Preguntas','#faq']].map(([t,href])=>({t,href})),
      sbD:sbar('#34312B'),sbOff:sbar('#34312B',true),
      // Hero: una misma actividad vista en la app y en el panel, de la asignación al cierre.
      // Hero: las etapas de la actividad van al ritmo del teléfono (H = 9 momentos) y al tocar una, el teléfono salta ahí.
      stages:[['send','Asignas','Llega al celular de tu equipo',0,2],['pin','Se registra en sitio','Ubicación, formulario, fotos y firma',2,3],['clock','Se envía a revisión','Con o sin señal',5,2],['check','Autorizas el cierre','Tu cliente se entera por correo',7,2]].map(([i,t,d,from,len],n)=>{const on=H>=from&&H<from+len;return {t,d,n:'0'+(n+1),ic:ic(i,17,2.2),cls:on?'hx-r on':'hx-r',bar:'width:'+(on?Math.round((H-from+1)/len*100):0)+'%',on:()=>set({t:from})}}),
      hero:(()=>{const k=[0,0,1,2,3,4,4,5,5][H];
        return{list:H===0,det:H>0,d:detail(k),l:listV(true)}})(),
      // Cómo funciona: 5 pasos. En escritorio el paso activo lo marca el scroll; en móvil avanza solo o al tocar.
      steps:[
        ['01 · Diseña','Arma cada tipo de actividad a tu medida','Arrastras los pasos que necesitas: ubicación, formulario, fotos, firma o comentarios. Tú decides el orden y cuáles son obligatorios.',['6 tipos de paso y más de 20 tipos de pregunta, sin programar.','Un paso puede traer otros adentro: se abren al completarlo.'],['sparkle','Conéctalo con tu IA','Pídele el formulario o el tipo de actividad: te arma el borrador y lo revisas con tu equipo antes de crearlo.',['Claude','ChatGPT']]],
        ['02 · Asigna','Asignas en un minuto y llega al celular','Eliges el tipo, a quién va, el cliente y el horario. A tu usuario de campo le llega el aviso y la actividad aparece en su lista.',['Sitio, dirección e inicio y fin programados.','Si lo permites, tu equipo también crea actividades desde la app.'],['bell','Le llega al celular al momento','Aviso en el teléfono y la actividad ya está en su lista. Sin llamadas ni mensajes para avisar.']],
        ['03 · Captura','Cada paso se registra en sitio','Preguntas Sí / No que abren más preguntas, fotos de evidencia y la firma de quien recibe. La actividad arranca sola al guardar el primer paso.',['Los pasos se hacen en el orden que convenga.','Fotos de referencia: tu equipo repite la toma del ejemplo.','Lector de QR y código de barras dentro del formulario.'],['form','Preguntas que abren preguntas','Según la respuesta Sí o No, el formulario muestra solo lo que toca contestar.']],
        ['04 · Sin señal','Sin señal, el trabajo sigue','Respuestas, fotos, firma y hasta el cierre se guardan en el teléfono. Cuando vuelve la conexión, la app avisa y se envía.',['Modo offline para zonas con señal inestable.','El GPS registra la ubicación aunque no haya red.','Sin Wi-Fi, tu usuario decide si envía con sus datos.'],['cloudOk','Nada se pierde','Lo capturado queda en el teléfono hasta que se envía, aunque la actividad se cierre sin red.']],
        ['05 · Revisa','Revisas, autorizas y tu cliente se entera','Ves el reporte con respuestas, fotos, mapa y firma. Autorizas el cierre o lo regresas con un motivo para que se corrija.',['Correo al iniciar y al cerrar, a quien tú definas.','Bitácora con cada movimiento y su hora.','Cada evento puede llegar a tu sistema por webhook.'],['shield','Tú autorizas el cierre','Nada se da por terminado hasta que lo apruebas. Si falta algo, regresa con el motivo.']]
      ].map(([k,t,d,b,h],i)=>({i,k,t,d,b:b.map(x=>({t:x})),hl:{ic:ic(h[0],19,2.2),t:h[1],d:h[2],has:!!h[3],chips:(h[3]||[]).map(x=>({t:x}))},cls:i===f?'feat on':'feat',on:()=>{if(this._mq.matches){this._tap=Date.now();set({feat:i})}}})),
      pal:[['pin','Ubicación','#8B5CF6'],['form','Agregar formulario','#7C4DEB'],['camera','Foto evidencia','#4F7A3A'],['pen','Firma de recibido','#8B5CF6'],['msg','Comentarios','#B07A34'],['images','Fotos de referencia','#D96F2E']].map(([i,t,fg])=>({t,fg,ic:ic(i,14,2.2)})),
      seq:[['map','Ubicación',0],['form','Checklist de mantenimiento',0],['cam','Foto evidencia',1],['sign','Firma de recibido',1],['msg','Comentarios',0]].map(([k,t,d])=>({t,ic:ic(STEP[k][0],13,2.2),bg:STEP[k][1],fg:STEP[k][2],ml:d?'22px':'0',bd:d?'#DDD3FB':'#ECECF1'})),
      shots:[['linear-gradient(135deg,#CBD5E1,#64748B)','09:27'],['linear-gradient(135deg,#D6D3D1,#78716C)','09:29'],['linear-gradient(135deg,#BFDBFE,#475569)','09:31']].map(([bg,tm])=>({bg,tm})),
      queue:[['Mantenimiento preventivo','En cola · Cerrada sin red 09:46',['Formulario','3 fotos · 2.1 MB','Firma']],['Reporte de falla','En cola · En curso',['2 fotos · 1.4 MB']]].map(([t,sub,ch])=>({t,s:sub,chips:ch.map(x=>({t:x}))})),
      answers:[['¿El equipo enciende?','Sí'],['Temperatura de salida (°C)','18'],['¿Hay fuga visible?','No']].map(([q,a])=>({q,a})),
      log:[['08:41','Actividad asignada'],['09:04','Actividad iniciada'],['09:18','Formulario guardado'],['09:31','Foto evidencia'],['09:41','Firma de recibido'],['09:46','Enviada a autorización']].map(([tm,t])=>({tm,t})),
      st:(()=>{const c=s.t%6,u=s.t%4;
        const MS=['Ubicación','Checklist de mantenimiento','Foto evidencia','Firma de recibido','Enviar a revisión'];
        return{f0:f===0,f1:f===1,f2:f===2,f3:f===3,f4:f===4,d0:detail(0),l:listV(true),lOff:listV(false),
          whereIc:f===0||f===4?ic('monitor',13,2.2):ic('mobile',13,2.2),where:['Panel web · Tipos de actividad','Panel web → App','App · Mantenimiento preventivo','App · Por enviar','Panel web · Reporte'][f],
          cap:{u:c===0,fm:c===1,ph:c===2,sg:c===3,dt:c>=4,d:detail(3),mini:MS.map((t,i)=>{const at=Math.min(c,4);return{t,n:i<at?ic('check',12,3.2):i+1,cls:i<at?'mst ok':i===at?'mst on':'mst'}})},
          off:{wait:u===0,ask:u===1,send:u>=2,pct:u===3?'100%':'64%',btn:['Esperando conexión','Enviar todo (2)','Enviando… 64%','Enviando… 100%'][u],btnBg:u?AC.pd:'#E4E6EB',btnFg:u?'#fff':AC.dis,sb:u?sbar('#34312B'):sbar('#34312B',true)},
          rev:{pend:u<2,done:u>=2,mail:u>=2,b:bdg(u<2?'r':'c'),okCls:u===1?'wbtn p hit':'wbtn p'},
          dots:[0,1,2,3,4].map(i=>({cls:i===f?'on':''}))}})(),
      billing:[[false,'Mensual'],[true,'Anual']].map(([a,t])=>{const on=s.annual===a;return {t,save:a,aria:on?'true':'false',on:()=>set({annual:a}),bg:on?'#FFFFFF':'transparent',fg:on?'#111118':'#4B4C58',sh:on?'0 2px 8px -4px rgba(17,17,30,.25)':'none'}}),
      plans:[
        ['Inicial','Para empezar a ordenar tu operación.',P[0],'MXN / mes',Y[0],['App para tu equipo en campo','Hasta 3 tipos de actividad','Formularios, fotos y firma','Reporte PDF y exportar a Excel','MFA incluido'],'Solicitar demo',false],
        ['Pro','Para equipos que entregan reportes a sus clientes.',P[1],'MXN / mes',Y[1],['Todo lo de Inicial','Formularios anidados ilimitados','Autorizar y rechazar','Avisos por correo y WhatsApp','Notificaciones personalizadas a tu necesidad','Conecta Claude o ChatGPT (MCP)'],'Solicitar demo',true],
        ['Empresa','Para operaciones con varias empresas o regiones.','Hablemos','','',['Todo lo de Pro','Multiempresa con tu marca','Webhooks e integraciones','Soporte prioritario','Soporte a la medida'],'Armemos tu plan',false]
      ].map(([name,desc,price,unit,yearly,items,cta,pop],n)=>({name,desc,price,unit,yearly,pop,cta,seatBg:pop?'#F3EEFF':'#F4F4F7',seatT:n<2?'Incluye 5 usuarios':'Usuarios a tu medida',seatD:n<2?'Admin, supervisor o campo, como quieras':'Paquetes según el tamaño de tu equipo',seats:[0,1,2,3,4].map(i=>{const more=n===2&&i>2;return{cls:more?'more':'',ic:ic(more?'plus':'user',more?12:13,2.4)}}),items:items.map(t=>({t})),border:pop?'2px solid #7C3AED':'1px solid #ECECF1',btn:pop?'p':'o'})),
      
      faqs:[
        ['¿Funciona si mi equipo no tiene señal?','Sí. La app guarda ubicación, respuestas, fotos y firma en el teléfono. Cuando recupera conexión avisa y se envía; si tu usuario lo prefiere, sin preguntar.',['Fotos y firma sin señal','Envío automático','Aviso al recuperar señal']],
        ['¿Cómo se conecta con Claude o ChatGPT?','HelmPoint tiene un servidor MCP. Lo conectas a Claude o ChatGPT con tu cuenta, autorizas los permisos y puedes preguntarle por tus actividades, pedirle resúmenes, crear asignaciones o diseñar formularios.',['Con tu cuenta y tus permisos','Claude','ChatGPT']],
        ['¿Cómo protegen el acceso?','Verificación en dos pasos (MFA) con app autenticadora, roles con permisos por sección y sesiones que puedes cerrar desde el panel.',['MFA con app autenticadora','Roles por sección','Cierre de sesiones']],
        ['¿Necesito programar para crear formularios?','No. Los armas con un constructor visual, incluso con preguntas Sí/No que abren otras preguntas adentro.',['Sin programar','Constructor visual','Preguntas que abren preguntas']],
        ['¿Mi cliente necesita una cuenta?','No. Recibe un correo cuando la actividad inicia y otro cuando se cierra. Tú defines a qué correos llega.',['Sin cuenta para tu cliente','Correo al iniciar','Correo al cerrar']],
        ['¿Puedo conectarlo con mi sistema?','Sí. Con webhooks recibes cada evento de la actividad en tu servidor, firmado para que sepas que viene de HelmPoint.',['Webhooks firmados','Cada evento de la actividad']]
      ].map(([q,a,ch],i)=>{const open=s.faq===i;return {q,a,open,n:('0'+(i+1)).slice(-2),cls:open?'fq on':'fq',tg:open?I.minusSm:I.plusSm,chips:ch.map((t,j)=>({t,cls:j?'ck':'ck g',ck:j?'':I.checkXs})),aria:open?'true':'false',on:()=>set({faq:open?null:i}),rot:open?'rotate(45deg)':'none',nBg:open?'#7C3AED':'#F4F4F7',nFg:open?'#FFFFFF':'#7E7F8C'}}),
      demoPts:['Configuración inicial incluida','Sin tarjeta de crédito'].map(t=>({t})),
      name:s.name,mail:s.mail,useCase:s.useCase,onName:e=>set({name:e.target.value}),onMail:e=>set({mail:e.target.value}),onUseCase:e=>set({useCase:e.target.value}),
      sizes:['1–5','6–20','21–50','50+'].map(x=>{const on=s.size===x;return {t:x,aria:on?'true':'false',on:()=>set({size:x}),border:on?'1.5px solid #7C3AED':'1px solid #D6D8DF',bg:on?'#F3EEFF':'#FFFFFF',fg:on?'#5B21B6':'#4B4C58'}}),
      blocked:s.sending||!s.name.trim()||!/^\S+@\S+\.\S+$/.test(s.mail)||!s.size,
      blockedOpacity:(s.sending||!s.name.trim()||!/^\S+@\S+\.\S+$/.test(s.mail)||!s.size)?'.6':'1',
      sending:s.sending,error:s.error,hasError:!!s.error,submitLabel:s.sending?'Enviando…':'Agendar demo',
      submit:async e=>{e.preventDefault();if(s.sending)return;
        set({sending:true,error:''});
        try{
          const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({name:s.name.trim(),email:s.mail.trim(),size:s.size,useCase:s.useCase.trim()})});
          const d=await r.json().catch(()=>({}));
          if(r.ok&&d.ok)set({sent:true,sending:false});
          else set({sending:false,error:d.error||'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos a '+MAIL+'.'});
        }catch(_){set({sending:false,error:'No hay conexión. Intenta de nuevo o escríbenos a '+MAIL+'.'})}
      },sent:s.sent,notSent:!s.sent,firstName:(s.name.trim().split(' ')[0]||''),
      openPriv:e=>{e&&e.preventDefault();set({lgOpen:true,lgTab:'p',lgSec:0})},openTerms:e=>{e&&e.preventDefault();set({lgOpen:true,lgTab:'t',lgSec:0})},
      lg:(()=>{const d=LEGAL[s.lgTab];return {open:s.lgOpen,mail:MAIL,close:()=>set({lgOpen:false}),
        tabs:[['t','Términos de uso'],['p','Aviso de Privacidad']].map(([k,x])=>{const on=s.lgTab===k;return {t:x,aria:on?'true':'false',on:()=>set({lgTab:k,lgSec:0}),bg:on?'var(--surface)':'transparent',fg:on?'var(--text)':'var(--text-2)',sh:on?'var(--shadow-sm)':'none'}}),
        d:{title:d.title,ver:d.ver,date:d.date,foot:d.foot,sum:d.sum.map(([i,x,dd])=>({ic:ic(i,17,2.2),t:x,d:dd})),
          secs:d.secs.map(([x,ps],k)=>{const open=s.lgSec===k;return {n:String(k+1).padStart(2,'0'),t:x,open,aria:open?'true':'false',on:()=>set({lgSec:open?null:k}),rot:open?'rotate(180deg)':'none',bd:open?'color-mix(in srgb, var(--accent) 35%, var(--line))':'var(--line)',ps:ps.map(t=>({t}))}})}}})(),
      footCols:[['Producto',[['Cómo funciona','#como'],['Lo que incluye','#producto'],['Asistente con IA','asistente.html'],['Precios','#precios']]],['Empresa',[['Contacto','#demo'],['Preguntas','#faq'],['Iniciar sesión','#']]],['Legal',[['Términos de uso','#','t'],['Aviso de Privacidad','#','p']]]].map(([t,items])=>({t,items:items.map(([x,h,lk])=>({t:x,h,on:lk?(e=>{e.preventDefault();set({lgOpen:true,lgTab:lk,lgSec:0})}):(()=>{})}))}))
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
