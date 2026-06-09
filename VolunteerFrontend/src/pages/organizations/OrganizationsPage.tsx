// import { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
//
// const CAT_LABELS: Record<OrgCategory|'all', string> = {
//   all:'Все направления', eco:'Экология', social:'Соц. помощь', animals:'Животные', youth:'Молодёжь'
// };
// const CAT_ICONS: Record<OrgCategory|'all', string> = {
//   all:'', eco:'fa-leaf', social:'fa-hands-helping', animals:'fa-paw', youth:'fa-graduation-cap'
// };

export function OrganizationsPage() {
  const { notify } = useNotification();
  // const [cat, setCat] = useState<OrgCategory|'all'>('all');
  // const [search, setSearch] = useState('');
  // const [searchRaw, setSearchRaw] = useState('');
  // const [timer, setTimer] = useState<ReturnType<typeof setTimeout>|null>(null);

  // const onSearch = (v: string) => {
  //   setSearchRaw(v);
  //   if (timer) clearTimeout(timer);
  //   setTimer(setTimeout(()=>setSearch(v), 300));
  // };
  //
  // const filtered = ORGS
  //   .filter(o => cat==='all' || o.category===cat)
  //   .filter(o => !search || o.searchKey.toLowerCase().includes(search.toLowerCase()) || o.name.toLowerCase().includes(search.toLowerCase()));

  // const handleJoin = (name: string) => notify(`Заявка в «${name}» отправлена! 🎉`);

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-gray-900 mb-6 leading-tight">
              Волонтёрские организации <span className="text-primary">Приднестровья</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">Познакомьтесь с командами, которые ежедневно делают мир вокруг нас лучше. Найдите организацию, близкую вам по духу, и вступайте в ряды добровольцев.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {['Проверенные организации','Прямая связь с командой'].map(b=>(
                <div key={b} className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm"><i className="fas fa-check-circle text-primary" /><span>{b}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="py-5 bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/*<div className="relative w-full md:w-96">*/}
            {/*  <input value={searchRaw} onChange={e=>onSearch(e.target.value)} placeholder="Поиск организации..."*/}
            {/*    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" />*/}
            {/*  <i className="fas fa-search absolute left-3.5 top-3 text-gray-400" />*/}
            {/*</div>*/}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
              {/*{(['all','eco','social','animals','youth'] as Array<OrgCategory|'all'>).map(k=>(*/}
              {/*  <button key={k} onClick={()=>setCat(k)}*/}
              {/*    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${cat===k?'bg-primary text-white shadow-sm':'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>*/}
              {/*    {CAT_ICONS[k] && <i className={`fas ${CAT_ICONS[k]} mr-1`} />}{CAT_LABELS[k]}*/}
              {/*  </button>*/}
              {/*))}*/}
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/*{filtered.length===0*/}
          {/*  ? <div className="text-center py-20">*/}
          {/*      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4"><i className="fas fa-search text-3xl text-gray-400" /></div>*/}
          {/*      <h3 className="text-xl font-bold text-gray-900 mb-2">Ничего не найдено</h3>*/}
          {/*      <p className="text-gray-600">Попробуйте изменить параметры поиска или категорию.</p>*/}
          {/*    </div>*/}
          {/*  : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">*/}
          {/*      {filtered.map(org=>(*/}
          {/*        <article key={org.id} className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 overflow-hidden pt-14 flex flex-col">*/}
          {/*          /!* bg image *!/*/}
          {/*          <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url('${org.bgImg}')`,opacity:0.07}} />*/}
          {/*          /!* logo *!/*/}
          {/*          <div className="absolute -top-0 left-1/2 -translate-x-1/2 translate-y-4">*/}
          {/*            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-gray-100">*/}
          {/*              <i className={`${org.icon} text-3xl ${org.iconColor}`} />*/}
          {/*            </div>*/}
          {/*          </div>*/}
          {/*          <div className="relative p-8 pt-6 flex flex-col flex-grow text-center">*/}
          {/*            <div className="flex justify-center gap-2 mb-3">*/}
          {/*              /!* category badge *!/*/}
          {/*              {org.category==='eco' && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Экология</span>}*/}
          {/*              {org.category==='social' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">Соц. помощь</span>}*/}
          {/*              {org.category==='animals' && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase">Животные</span>}*/}
          {/*              {org.category==='youth' && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase">Молодёжь</span>}*/}
          {/*              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">{org.city}</span>*/}
          {/*            </div>*/}
          {/*            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition">{org.name}</h3>*/}
          {/*            <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-grow">{org.description}</p>*/}
          {/*            <div className="flex justify-center gap-6 mb-5 border-t border-gray-100 py-3">*/}
          {/*              {org.stats.map(s=>(*/}
          {/*                <div key={s.label} className="text-center"><div className="text-lg font-bold text-primary">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>*/}
          {/*              ))}*/}
          {/*            </div>*/}
          {/*            <button onClick={()=>handleJoin(org.name)} className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-md">*/}
          {/*              <i className="fas fa-user-plus mr-2" />Вступить в команду*/}
          {/*            </button>*/}
          {/*          </div>*/}
          {/*        </article>*/}
          {/*      ))}*/}
          {/*    </div>*/}
          {/*}*/}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-dark/30 rounded-full -ml-20 -mb-20 blur-3xl" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-6">Представить свою организацию?</h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">Если вы руководите волонтёрской инициативой и хотите попасть в наш каталог — отправьте заявку. Мы будем рады сотрудничеству!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={()=>notify('Форма заявки скоро будет доступна!', 'info')} className="px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition shadow-lg">
              <i className="fas fa-paper-plane mr-2" />Подать заявку
            </button>
            <button onClick={()=>notify('Форма обратной связи скоро будет доступна!', 'info')} className="px-8 py-4 bg-transparent text-white border-2 border-white font-bold rounded-xl hover:bg-white/10 transition">
              <i className="fas fa-envelope mr-2" />Написать нам
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
