const tools=[
      {slug:'ketcher',n:'Ketcher',d:'开源专业化学结构编辑器，支持多种格式导入与导出。',c:'结构绘制',i:'Ke',u:'https://lifescience.opensource.epam.com/ketcher/'},
      {slug:'molview',n:'MolView',d:'在浏览器中绘制分子，并快速查看三维结构。',c:'结构绘制',i:'3D',u:'https://molview.org/'},
      {slug:'opsin',n:'OPSIN',d:'将 IUPAC 系统命名快速转换为化学结构。',c:'结构绘制',i:'Op',u:'https://opsin.ch.cam.ac.uk/'},
      {slug:'pubchem',n:'PubChem',d:'化合物结构、性质、生物活性及安全信息数据库。',c:'化合物数据库',i:'Pu',u:'https://pubchem.ncbi.nlm.nih.gov/'},
      {slug:'chemspider',n:'ChemSpider',d:'英国皇家化学会维护的化学结构与信息数据库。',c:'化合物数据库',i:'Cs',u:'https://www.chemspider.com/'},
      {slug:'nist-webbook',n:'NIST WebBook',d:'热化学、光谱和物理化学性质权威数据。',c:'化合物数据库',i:'Ni',u:'https://webbook.nist.gov/chemistry/'},
      {slug:'chebi',n:'ChEBI',d:'具有生物学意义的小分子化学实体数据库。',c:'化合物数据库',i:'Cb',u:'https://www.ebi.ac.uk/chebi/'},
      {slug:'zinc',n:'ZINC',d:'面向虚拟筛选的可购买化合物结构数据库。',c:'化合物数据库',i:'Zn',u:'https://zinc.docking.org/'},
      {slug:'reaxys',n:'Reaxys',d:'化学反应、物质性质和合成路线专业数据库。',c:'合成化学',i:'Rx',u:'https://www.reaxys.com/'},
      {slug:'scifinder',n:'SciFinder',d:'CAS 提供的物质、反应及科学文献检索平台。',c:'合成化学',i:'Sf',u:'https://scifinder.cas.org/'},
      {slug:'organic-syntheses',n:'Organic Syntheses',d:'经过复现实验验证的有机合成操作手册。',c:'合成化学',i:'Os',u:'https://www.orgsyn.org/'},
      {slug:'organic-chemistry-portal',n:'Organic Chemistry Portal',d:'有机反应、试剂、命名反应及化学资讯。',c:'合成化学',i:'Oc',u:'https://www.organic-chemistry.org/'},
      {slug:'common-organic-chemistry',n:'Common Organic Chemistry',d:'整理常用有机反应、试剂、实验操作与合成参考资料。',c:'合成化学',i:'CO',u:'https://commonorganicchemistry.com/'},
      {slug:'chemcalc',n:'ChemCalc',d:'分子式分析、同位素分布与精确质量计算。',c:'计算工具',i:'Cc',u:'https://www.chemcalc.org/'},
      {slug:'chemicalaid',n:'ChemicalAid',d:'配平化学方程式、摩尔质量及常用化学计算。',c:'计算工具',i:'Ca',u:'https://www.chemicalaid.com/'},
      {slug:'molgpka',n:'MolGpKa',d:'基于图神经网络的分子 pKa 在线预测工具。',c:'计算工具',i:'pK',u:'https://xundrug.cn/molgpka'},
      {slug:'sdbs',n:'SDBS',d:'日本 AIST 提供的有机化合物综合谱图数据库。',c:'光谱分析',i:'Sd',u:'https://sdbs.db.aist.go.jp/'},
      {slug:'nmrdb',n:'NMRDB',d:'在线核磁共振谱预测与化学结构解析工具。',c:'光谱分析',i:'Nm',u:'https://www.nmrdb.org/'},
      {slug:'web-of-science',n:'Web of Science',d:'跨学科引文数据库与学术成果检索平台。',c:'文献专利搜索',i:'Wo',u:'https://www.webofscience.com/'},
      {slug:'pubmed',n:'PubMed',d:'生物医学与生命科学领域的文献检索数据库。',c:'文献专利搜索',i:'Pm',u:'https://pubmed.ncbi.nlm.nih.gov/'},
      {slug:'google-scholar',n:'Google Scholar',d:'广泛检索论文、学位论文、图书及引用。',c:'文献专利搜索',i:'Gs',u:'https://scholar.google.com/'},
      {slug:'cnki',n:'中国知网 CNKI',d:'中文学术期刊、学位论文和会议文献平台。',c:'文献专利搜索',i:'知',u:'https://www.cnki.net/'},
      {slug:'espacenet',n:'Espacenet',d:'欧洲专利局提供的全球专利免费检索服务。',c:'文献专利搜索',i:'Ep',u:'https://worldwide.espacenet.com/'},
      {slug:'chemix',n:'Chemix',d:'轻松绘制烧杯、仪器和实验装置示意图。',c:'科研绘图',i:'Cx',u:'https://chemix.org/'},
      {slug:'rawgraphs',n:'RAWGraphs',d:'将表格数据快速转换为高质量矢量图表。',c:'科研绘图',i:'Rw',u:'https://www.rawgraphs.io/'},
      {slug:'hiplot',n:'Hiplot',d:'面向科研数据分析与可视化的在线工具集。',c:'科研绘图',i:'Hi',u:'https://hiplot.cn/'},
      {slug:'sigma-aldrich',n:'Sigma-Aldrich',d:'化学试剂、耗材与产品技术资料查询。',c:'试剂采购',i:'Σ',u:'https://www.sigmaaldrich.cn/CN/zh'},
      {slug:'aladdin',n:'阿拉丁试剂',d:'化学、生化试剂及材料产品检索采购平台。',c:'试剂采购',i:'阿',u:'https://www.aladdin-e.com/'},
      {slug:'macklin',n:'麦克林试剂',d:'科研试剂、实验耗材与化学品采购平台。',c:'试剂采购',i:'麦',u:'https://www.macklin.cn/'},
      {slug:'ptable',n:'Ptable',d:'交互式元素周期表，直观浏览完整元素数据。',c:'学习资源',i:'Pt',u:'https://ptable.com/'},
      {slug:'master-organic-chemistry',n:'Master Organic Chemistry',d:'清晰实用的有机反应指南与学习资料。',c:'学习资源',i:'Mo',u:'https://www.masterorganicchemistry.com/reaction-guide/'},
      // Append resources to preserve the existing numeric favicon mapping.
      {slug:'acs-publications',n:'ACS Publications',d:'美国化学会期刊平台，收录 JACS、Chemical Reviews 等化学期刊。',c:'学术期刊',i:'ACS',u:'https://pubs.acs.org/'},
      {slug:'rsc-publishing',n:'RSC Publishing',d:'英国皇家化学会期刊与图书平台，含 Chemical Science、ChemComm 等。',c:'学术期刊',i:'RSC',u:'https://pubs.rsc.org/'},
      {slug:'sciencedirect',n:'ScienceDirect · Elsevier',d:'爱思唯尔（Elsevier）的期刊与图书平台，涵盖化学、材料及生命科学。',c:'学术期刊',i:'Sd',u:'https://www.sciencedirect.com/'},
      {slug:'wiley-online-library',n:'Wiley Online Library',d:'Wiley 学术期刊与图书平台，收录 Angewandte Chemie、Advanced Materials 等。',c:'学术期刊',i:'Wi',u:'https://onlinelibrary.wiley.com/'},
      {slug:'springer-nature-link',n:'Springer Nature Link',d:'施普林格·自然旗下期刊与电子书平台，覆盖化学、材料及相关学科。',c:'学术期刊',i:'Sp',u:'https://link.springer.com/'},
      {slug:'nature',n:'Nature',d:'Nature 系列期刊入口，可浏览 Nature Chemistry、Nature Catalysis 等研究。',c:'学术期刊',i:'Na',u:'https://www.nature.com/'},
      {slug:'science',n:'Science',d:'美国科学促进会（AAAS）的 Science 系列期刊平台，提供跨学科研究与科学新闻。',c:'学术期刊',i:'Sc',u:'https://www.science.org/'},
      {slug:'tci-chemicals',n:'TCI Chemicals',d:'东京化成（TCI）的化学试剂、功能材料与产品技术资料查询及采购。',c:'试剂采购',i:'TCI',u:'https://www.tcichemicals.com/'},
      {slug:'thermo-fisher-scientific',n:'Thermo Fisher Scientific',d:'赛默飞世尔的科研试剂、仪器及实验耗材平台，提供产品查询与技术资料。',c:'试剂采购',i:'Tf',u:'https://www.thermofisher.com/'},
      {slug:'wako',n:'富士和光 Wako',d:'FUJIFILM Wako 的分析、生化、合成及材料研究试剂与产品资料。',c:'试剂采购',i:'Wa',u:'https://labchem-wako.fujifilm.com/asia/index.html'},
      {slug:'kanto-chemical',n:'关东化学 Kanto',d:'Kanto Chemical 的有机、无机、分析试剂及电子化学品查询平台。',c:'试剂采购',i:'Ka',u:'https://www.kanto.co.jp/english/'},
      {slug:'strem',n:'Strem',d:'用于科研与合成的金属催化剂、配体、有机金属化合物及特种试剂。',c:'试剂采购',i:'St',u:'https://www.strem.com/'},
      {slug:'fluorochem',n:'Fluorochem',d:'芳香族、杂环及含氟分子砌块，提供有机合成试剂与定制合成服务。',c:'试剂采购',i:'Fl',u:'https://fluorochem.co.uk/'},
      {slug:'cambridge-isotope-laboratories',n:'Cambridge Isotope Laboratories',d:'剑桥同位素实验室（CIL）的 NMR 氘代溶剂与稳定同位素标记试剂。',c:'试剂采购',i:'CIL',u:'https://isotope.com/'},
      {slug:'macmillan-group',n:'MacMillan Group',d:'普林斯顿大学；David MacMillan 的光氧化还原催化、有机催化与化学生物学研究。',c:'化学研究课题组主页',i:'Mc',u:'https://macmillan.princeton.edu/'},
      {slug:'baran-lab',n:'Baran Lab',d:'Scripps Research；Phil Baran 的天然产物全合成、合成方法学及公开专题资料。',c:'化学研究课题组主页',i:'Ba',u:'https://baranlab.org/'},
      {slug:'hartwig-group',n:'Hartwig Group',d:'加州大学伯克利分校；John Hartwig 的过渡金属催化、C–H 官能团化与不对称合成。',c:'化学研究课题组主页',i:'Ha',u:'https://hartwig.cchem.berkeley.edu/'},
      {slug:'houk-group',n:'Houk Group',d:'加州大学洛杉矶分校（UCLA）；Ken Houk 的计算有机化学、反应机理与选择性研究资料。',c:'化学研究课题组主页',i:'Ho',u:'https://www.chem.ucla.edu/houk/'},
      {slug:'yaghi-group',n:'Yaghi Group',d:'加州大学伯克利分校；Omar Yaghi 的网状化学、金属有机框架 MOF 与共价有机框架 COF。',c:'化学研究课题组主页',i:'Ya',u:'https://yaghi.berkeley.edu/'},
      {slug:'arnold-group',n:'Arnold Group',d:'加州理工学院；Frances Arnold 的定向进化、蛋白质设计与生物催化研究。',c:'化学研究课题组主页',i:'Ar',u:'http://fhalab.caltech.edu/'},
      {slug:'shu-li-you-group',n:'游书力课题组',d:'中科院上海有机所；Shu-Li You 的不对称去芳构化、C–H 官能团化与手性催化研究。',c:'化学研究课题组主页',i:'You',u:'http://shuliyou.sioc.ac.cn/'},
      {slug:'feng-xiaoming-group',n:'冯小明课题组 · ASL',d:'四川大学；Xiaoming Feng 的不对称合成、手性催化剂与双氮氧配体研究。',c:'化学研究课题组主页',i:'ASL',u:'https://www.scu.edu.cn/chem_asl/'},
      {slug:'yang-zhen-group',n:'杨震课题组',d:'北京大学；Zhen Yang 的天然产物全合成、合成方法学与小分子化学生物学研究资料。',c:'化学研究课题组主页',i:'YZ',u:'https://www.chem.pku.edu.cn/zyang/'},
      {slug:'lei-xiaoguang-group',n:'雷晓光课题组',d:'北京大学；Xiaoguang Lei 的功能导向有机合成、化学生物学、生物催化与药物研究。',c:'化学研究课题组主页',i:'Lei',u:'https://www.chem.pku.edu.cn/leigroup/'},
      {slug:'tang-yong-group',n:'唐勇课题组',d:'中科院上海有机所；Yong Tang 的不对称催化、烯烃聚合、叶立德化学与全合成研究。',c:'化学研究课题组主页',i:'TY',u:'https://tangyong.sioc.ac.cn/'},
      {slug:'gong-liuzhu-group',n:'龚流柱课题组',d:'中国科学技术大学；Liu-Zhu Gong 的不对称催化、有机小分子与金属联合催化研究。',c:'化学研究课题组主页',i:'Gon',u:'http://staff.ustc.edu.cn/~gonglz/'},
      {slug:'pei-wang-group',n:'裴坚–王婕妤课题组',d:'北京大学；Jian Pei、Jie-Yu Wang 的有机光电材料、共轭高分子与超分子自组装研究。',c:'化学研究课题组主页',i:'Pei',u:'https://www.chem.pku.edu.cn/pei/zwsy/index.htm'},
      {slug:'inoue-group',n:'井上将行 Inoue',d:'日本东京大学；Masayuki Inoue 的复杂天然产物全合成、合成策略与生物功能研究。',c:'化学研究课题组主页',i:'In',u:'https://inoue.f.u-tokyo.ac.jp/e_index.html'},
      {slug:'itami-group',n:'伊丹健一郎 Itami',d:'日本理化学研究所 RIKEN；Kenichiro Itami 的分子纳米碳、分子编辑与功能材料研究。',c:'化学研究课题组主页',i:'It',u:'https://itami-lab.com/?lang=en'},
      {slug:'ito-group',n:'伊藤肇 Ito',d:'日本北海道大学；Hajime Ito 的有机硼化学、铜催化、机械化学合成与响应材料研究。',c:'化学研究课题组主页',i:'Ito',u:'https://itogrouphp.eng.hokudai.ac.jp/en.html'},
      {slug:'maeda-theoretical-chemistry',n:'前田理 Maeda · 理论化学',d:'日本北海道大学；Satoshi Maeda 的计算化学、AFIR 方法、反应路径探索与反应机理研究。',c:'化学研究课题组主页',i:'Mae',u:'https://afir.sci.hokudai.ac.jp/theochem/en/'},
      {slug:'yamaguchi-group',n:'山口茂弘 Yamaguchi',d:'日本名古屋大学；Shigehiro Yamaguchi 的荧光分子、分子设计、主族与物理有机化学。',c:'化学研究课题组主页',i:'SY',u:'http://orgreact.chem.nagoya-u.ac.jp/en/index.html'},
      {slug:'yokoshima-group',n:'横岛聪 Yokoshima',d:'日本名古屋大学天然物化学研究室；Satoshi Yokoshima 的全合成研究，官网保留福山组机理题资料。',c:'化学研究课题组主页',i:'Yo',u:'https://www.ps.nagoya-u.ac.jp/lab_pages/natural_products/'},
      {slug:'fukuyama-yokoshima-problems',n:'福山–横岛机理习题',d:'Fukuyama／Yokoshima 组会反应机理题与参考解答，含历史档案及后续题目，按年月整理 PDF。',c:'学习资源',i:'FY',u:'https://www.ps.nagoya-u.ac.jp/lab_pages/natural_products/problem-e.html'},
      {slug:'sci-hub',n:'Sci-Hub',d:'SciHub 文献获取入口，支持 DOI 或论文链接查询；请留意版权与当地使用规定。',c:'文献专利搜索',i:'SH',u:'https://sci-hub.shop/'},
      {slug:'muchong',n:'小木虫',d:'Muchong 学术科研论坛，交流化学实验、仪器分析、读研经验与科研问题。',c:'社区与资讯',i:'木',u:'https://muchong.com/bbs/'},
      {slug:'chem-station',n:'化学空间 Chem-Station',d:'ChemStation / Chem Station 中文站，分享合成方法、反应机理、研究进展与化学访谈。',c:'社区与资讯',i:'CS',u:'https://cn.chem-station.com/'},
      {slug:'chemistry-stack-exchange',n:'Chemistry Stack Exchange',d:'英文化学问答社区，围绕有机、无机和物理化学问题给出解释与参考依据。',c:'社区与资讯',i:'SE',u:'https://chemistry.stackexchange.com/'},
      {slug:'chemistryviews',n:'ChemistryViews',d:'Chemistry Europe 的化学资讯杂志，提供研究亮点、人物访谈与学术活动信息。',c:'社区与资讯',i:'CV',u:'https://www.chemistryviews.org/'},
      {slug:'chemistry-world',n:'Chemistry World',d:'英国皇家化学会 RSC 的化学新闻、观点与播客；部分阅读内容需要注册或订阅。',c:'社区与资讯',i:'CW',u:'https://www.chemistryworld.com/'},
      {slug:'molaid',n:'摩熵化学 MolAid',d:'支持 CAS、分子式和结构检索，提供化合物信息、文献检索与合成设计入口。',c:'化合物数据库',i:'MA',u:'https://chem.molaid.com/home'},
      {slug:'chemistry-reference-resolver',n:'Chemistry Reference Resolver',d:'化学文献引用解析：用期刊缩写、卷页或 DOI 定位论文页面；全文权限依出版商而定。',c:'文献专利搜索',i:'CRR',u:'https://chemsearch.kovsky.net/'},
      {slug:'mdpi',n:'MDPI',d:'开放获取期刊平台，收录 Molecules、Catalysts 等化学期刊；投稿费用与许可需逐刊核对。',c:'学术期刊',i:'MD',u:'https://www.mdpi.com/',icon:false},
      {slug:'thieme-connect',n:'Thieme Connect',d:'Thieme（蒂默）期刊平台，提供 SYNTHESIS、SYNLETT 等化学期刊入口；部分全文需订阅。',c:'学术期刊',i:'Th',u:'https://www.thieme-connect.com/products',icon:false},
      {slug:'taylor-francis-online',n:'Taylor & Francis Online',d:'泰勒与弗朗西斯（T&F）期刊平台，涵盖物理化学、超分子化学等方向；全文依订阅或开放许可。',c:'学术期刊',i:'TF',u:'https://www.tandfonline.com/',icon:false}
    ];

// Display order is independent of tool indexes; unknown categories follow at the end.
const toolCategoryOrder=['结构绘制','化合物数据库','合成化学','计算工具','光谱分析','文献专利搜索','学术期刊','化学研究课题组主页','社区与资讯','科研绘图','试剂采购','学习资源'];
const toolCategories=[
  ...toolCategoryOrder.filter(category=>tools.some(tool=>tool.c===category)),
  ...new Set(tools.map(tool=>tool.c).filter(category=>!toolCategoryOrder.includes(category)))
];

// Stable URL slugs are explicit so category URLs never depend on transliteration rules.
const toolCategorySlugs={
  '结构绘制':'structure-drawing',
  '化合物数据库':'compound-databases',
  '合成化学':'synthesis',
  '计算工具':'calculation',
  '光谱分析':'spectroscopy',
  '文献专利搜索':'literature-patents',
  '学术期刊':'journals',
  '化学研究课题组主页':'research-groups',
  '社区与资讯':'community-news',
  '科研绘图':'scientific-visualization',
  '试剂采购':'chemical-suppliers',
  '学习资源':'learning-resources'
};

// Render-only priorities: keep tools and their numeric icon/bookmark identities unchanged.
const toolCategoryPriority={'文献专利搜索':['https://chemsearch.kovsky.net/']};
function orderCategoryTools(items,category){
  const priority=toolCategoryPriority[category]||[];
  const rank=tool=>{const index=priority.indexOf(tool.u);return index<0?priority.length:index};
  return [...items].sort((a,b)=>rank(a)-rank(b));
}
