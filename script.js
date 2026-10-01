document.querySelectorAll('[data-copy]').forEach((button)=>{
  button.addEventListener('click', async ()=>{
    const code = button.getAttribute('data-copy');
    try{
      await navigator.clipboard.writeText(code);
      const old = button.textContent;
      button.textContent = 'Kopiert ✓';
      setTimeout(()=>button.textContent=old,1400);
    }catch(e){
      alert('Code: '+code);
    }
  });
});
const toggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('.nav');
if(toggle&&nav){
  toggle.addEventListener('click',()=>nav.classList.toggle('open'));
}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
