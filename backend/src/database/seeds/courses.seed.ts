import { DataSource } from 'typeorm';
import { Author } from '../../entities/author.entity';
import { Chapter } from '../../entities/chapter.entity';
import { ContentType } from '../../entities/content-type.enum';
import {
  Course,
  CourseLevel,
  CourseStatus,
} from '../../entities/course.entity';
import { PedagogicalContent } from '../../entities/pedagogical-content.entity';
import { SubChapter } from '../../entities/sub-chapter.entity';

interface SeedContentDefinition {
  titleEn: string;
  titleFi: string;
  type: ContentType;
  contentEn: string;
  contentFi: string;
}

interface SeedSubChapterDefinition {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  contents: SeedContentDefinition[];
}

interface SeedChapterDefinition {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  subChapters: SeedSubChapterDefinition[];
}

interface SeedCourseDefinition {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  level: CourseLevel;
  status: CourseStatus;
  estimatedDuration: number;
  coverImage: string;
  outline: SeedChapterDefinition[];
  author: {
    name: string;
    roleEn: string;
    roleFi: string;
    biographyEn: string;
    biographyFi: string;
  };
}

const textContent = (
  titleEn: string,
  titleFi: string,
  contentEn: string,
  contentFi: string,
): SeedContentDefinition => ({
  titleEn,
  titleFi,
  type: ContentType.TEXT,
  contentEn,
  contentFi,
});

const subChapter = (
  titleEn: string,
  titleFi: string,
  descriptionEn: string,
  descriptionFi: string,
  contents: SeedContentDefinition[],
): SeedSubChapterDefinition => ({
  titleEn,
  titleFi,
  descriptionEn,
  descriptionFi,
  contents,
});

const chapter = (
  titleEn: string,
  titleFi: string,
  descriptionEn: string,
  descriptionFi: string,
  subChapters: SeedSubChapterDefinition[],
): SeedChapterDefinition => ({
  titleEn,
  titleFi,
  descriptionEn,
  descriptionFi,
  subChapters,
});

function buildCybersecurityFundamentalsOutline(): SeedChapterDefinition[] {
  return [
    chapter(
      'Security Foundations',
      'Turvallisuuden Perusteet',
      'Build a practical understanding of the core ideas behind modern cybersecurity.',
      'Rakenna kaytannollinen ymmarrys modernin kyberturvallisuuden perusideoista.',
      [
        subChapter(
          'Threats, Vulnerabilities, and Risk',
          'Uhat, Haavoittuvuudet ja Riskit',
          'Learn how threats, vulnerabilities, and business impact connect to one another.',
          'Opi miten uhat, haavoittuvuudet ja liiketoimintavaikutus liittyvat toisiinsa.',
          [
            textContent(
              'Core Risk Model',
              'Riskimallin Ydin',
              'Cybersecurity starts with understanding what could happen, what is weak, and what the impact would be.',
              'Kyberturvallisuus alkaa ymmarryksesta siita mita voi tapahtua, missa on heikkous ja miksi vaikutus on merkityksellinen.',
            ),
            textContent(
              'Common Entry Points',
              'Yleiset Sisaanpaasyreitit',
              'Attackers often begin with weak passwords, exposed services, phishing, or unpatched software.',
              'Hyokkaajat aloittavat usein heikoilla salasanoilla, avoimilla palveluilla, tietojenkalastelulla tai paikkaamattomilla ohjelmistoilla.',
            ),
          ],
        ),
        subChapter(
          'Defense in Depth',
          'Kerrostettu Puolustus',
          'Understand why strong security uses multiple layers instead of one perfect control.',
          'Ymmarra miksi vahva turvallisuus perustuu useisiin kerroksiin eika yhteen taydelliseen kontrolliin.',
          [
            textContent(
              'Layered Controls',
              'Kerrostetut Kontrollit',
              'Reliable defense combines people, process, and technology so one failure does not expose everything.',
              'Luotettava puolustus yhdistaa ihmiset, prosessit ja teknologian niin ettei yksi virhe paljasta kaikkea.',
            ),
          ],
        ),
      ],
    ),
    chapter(
      'Security Operations',
      'Turvallisuuden Operointi',
      'Move from concepts into the everyday habits used to keep systems safer.',
      'Siirry peruskasitteista paivittaisiin kaytantoihin joilla jarjestelmia pidetaan turvallisempina.',
      [
        subChapter(
          'Secure Daily Habits',
          'Turvalliset Paivittaiset Tavat',
          'See how routine behavior influences security outcomes more than one-off actions.',
          'Nae miten rutiinit vaikuttavat turvallisuustuloksiin enemman kuin yksittaiset toimet.',
          [
            textContent(
              'Operational Discipline',
              'Toiminnallinen Kurinalaisuus',
              'Simple habits such as patching, review, and least privilege reduce exposure over time.',
              'Yksinkertaiset tavat kuten paivitykset, tarkistukset ja vahimman oikeuden periaate pienentavat riskeja ajan myota.',
            ),
          ],
        ),
        subChapter(
          'Incident Reporting Basics',
          'Poikkeamien Ilmoittamisen Perusteet',
          'Know when to escalate, who to tell, and what information matters first.',
          'Tieda milloin eskaloida, kenelle ilmoittaa ja mitka tiedot ovat aluksi tarkeimpia.',
          [
            textContent(
              'First Response Checklist',
              'Ensitoimien Lista',
              'Good reporting is fast, factual, and focused on impact, scope, and immediate containment.',
              'Hyva ilmoittaminen on nopeaa, asiallista ja keskittyy vaikutukseen, laajuuteen ja valittomaan rajaamiseen.',
            ),
          ],
        ),
      ],
    ),
  ];
}

function buildAdvancedNetworkSecurityOutline(): SeedChapterDefinition[] {
  return [
    chapter(
      'Network Architecture',
      'Verkkoarkkitehtuuri',
      'Understand how secure design decisions shape safer network environments.',
      'Ymmarra miten turvalliset suunnitteluratkaisut rakentavat turvallisempia verkkoymparistoja.',
      [
        subChapter(
          'Segmentation and Trust Boundaries',
          'Segmentointi ja Luottamusrajat',
          'Separate critical systems so attackers cannot move freely after one compromise.',
          'Erottele kriittiset jarjestelmat niin etteivat hyokkaajat voi liikkua vapaasti yhden murtautumisen jalkeen.',
          [
            textContent(
              'Designing Secure Zones',
              'Turvavyohykkeiden Suunnittelu',
              'Security improves when sensitive systems are isolated behind clear network boundaries.',
              'Turvallisuus paranee kun herkhat jarjestelmat eristetaan selkeiden verkkorajojen taakse.',
            ),
          ],
        ),
        subChapter(
          'Traffic Visibility',
          'Liikenteen Nakyvyys',
          'Learn what meaningful monitoring looks like when traffic volume grows.',
          'Opi millaista merkityksellinen valvonta on kun liikennemaarat kasvavat.',
          [
            textContent(
              'Useful Telemetry',
              'Hyodyllinen Telemetria',
              'Teams need logs, flow data, and context to spot abnormal behavior early.',
              'Tiimit tarvitsevat lokeja, virtausdataa ja kontekstia havaitakseen poikkeavan toiminnan ajoissa.',
            ),
          ],
        ),
      ],
    ),
    chapter(
      'Protective Controls',
      'Suojaavat Kontrollit',
      'Focus on the controls that actively reduce network exposure and response time.',
      'Keskity kontrolleihin jotka aktiivisesti pienentavat verkon altistusta ja vasteaikaa.',
      [
        subChapter(
          'Firewalls and Policy Design',
          'Palomuurit ja Saantosuunnittelu',
          'Use explicit policy design instead of ad-hoc allow rules.',
          'Kayta harkittua saantosuunnittelua satunnaisten sallimissaantojen sijaan.',
          [
            textContent(
              'Policy Review Workflow',
              'Saantojen Tarkistusmalli',
              'Strong firewall policy starts with asset context, business need, and periodic cleanup.',
              'Vahva palomuurisaanto alkaa kohdekontekstista, liiketoimintatarpeesta ja saannollisesta siivouksesta.',
            ),
          ],
        ),
        subChapter(
          'Detection and Response Playbooks',
          'Havaitsemisen ja Vastetoimien Mallit',
          'Prepare repeatable response steps before abnormal traffic appears.',
          'Valmistele toistettavat vastetoimet ennen kuin poikkeava liikenne ilmestyy.',
          [
            textContent(
              'Network Response Actions',
              'Verkkovasteen Toimet',
              'Response playbooks should cover triage, isolation, communication, and evidence capture.',
              'Vastemallien tulee kattaa triage, eristys, viestinta ja todistusaineiston talteenotto.',
            ),
          ],
        ),
      ],
    ),
  ];
}

function buildPenetrationTestingOutline(): SeedChapterDefinition[] {
  return [
    chapter(
      'Planning the Engagement',
      'Testauksen Suunnittelu',
      'Set scope, rules, and expectations before any technical testing begins.',
      'Maarita laajuus, pelisaannot ja odotukset ennen teknisen testauksen aloittamista.',
      [
        subChapter(
          'Scope and Rules of Engagement',
          'Laajuus ja Pelisaannot',
          'A professional test starts with clear permissions, targets, and restrictions.',
          'Ammatillinen testi alkaa selkeilla luvilla, kohteilla ja rajoituksilla.',
          [
            textContent(
              'Authorization Matters',
              'Valtuutuksen Merkitys',
              'Good penetration testing is controlled, documented, and legally authorized from the start.',
              'Hyva penetraatiotestaus on hallittua, dokumentoitua ja laillisesti valtuutettua alusta asti.',
            ),
          ],
        ),
        subChapter(
          'Reconnaissance Workflow',
          'Tiedustelun Tyonkulku',
          'Gather context first so validation work stays focused and efficient.',
          'Kerää ensin konteksti jotta vahvistustyo pysyy kohdistettuna ja tehokkaana.',
          [
            textContent(
              'Recon Sources',
              'Tiedustelun Lahteet',
              'Recon combines public intelligence, service discovery, and target profiling.',
              'Tiedustelu yhdistaa julkisen tiedon, palveluiden kartoituksen ja kohdeprofiloinnin.',
            ),
          ],
        ),
      ],
    ),
    chapter(
      'Execution and Reporting',
      'Toteutus ja Raportointi',
      'Turn technical findings into reliable evidence and useful recommendations.',
      'Muuta tekniset havainnot luotettavaksi todistusaineistoksi ja hyodyllisiksi suosituksiksi.',
      [
        subChapter(
          'Validation and Exploitation Discipline',
          'Vahvistuksen ja Hyodyntamisen Kurinalaisuus',
          'Validate carefully instead of chasing noisy results or unstable proof.',
          'Vahvista havainnot huolellisesti meluisten tulosten tai epavakaan todistusaineiston jahtaamisen sijaan.',
          [
            textContent(
              'Controlled Validation',
              'Hallittu Vahvistus',
              'Professional testers prefer reliable confirmation over risky or unnecessary exploitation.',
              'Ammattilaiset suosivat luotettavaa vahvistusta riskialttiin tai tarpeettoman hyodyntamisen sijaan.',
            ),
          ],
        ),
        subChapter(
          'Reporting for Remediation',
          'Raportointi Korjausta Varten',
          'Make findings understandable so technical teams can actually act on them.',
          'Tee havainnoista ymmarrettavia jotta tekniset tiimit voivat todella toimia niiden perusteella.',
          [
            textContent(
              'Actionable Findings',
              'Toimintakelpoiset Havainnot',
              'The best reports explain risk, evidence, business impact, and concrete remediation steps.',
              'Parhaat raportit selittavat riskin, todistusaineiston, liiketoimintavaikutuksen ja konkreettiset korjausvaiheet.',
            ),
          ],
        ),
      ],
    ),
  ];
}

function buildCloudSecurityOutline(): SeedChapterDefinition[] {
  return [
    chapter(
      'Cloud Security Fundamentals',
      'Pilviturvallisuuden Perusteet',
      'Start with the models and responsibilities unique to cloud platforms.',
      'Aloita malleista ja vastuista jotka ovat ominaisia pilvialustoille.',
      [
        subChapter(
          'Shared Responsibility Model',
          'Jaetun Vastuun Malli',
          'Understand which controls belong to the provider and which belong to the customer.',
          'Ymmarra mitka kontrollit kuuluvat palveluntarjoajalle ja mitka asiakkaalle.',
          [
            textContent(
              'Who Owns What',
              'Kuka Omistaa Mita',
              'Cloud security breaks down when teams assume the provider covers customer-side misconfiguration.',
              'Pilviturvallisuus heikkenee kun tiimit olettavat palveluntarjoajan kattavan asiakkaan virheasetukset.',
            ),
          ],
        ),
        subChapter(
          'Identity and Access Control',
          'Identiteetti ja Paasynhallinta',
          'Reduce risk by tightening identities, permissions, and privileged access.',
          'Pienennä riskeja kiristamalla identiteetteja, oikeuksia ja etuoikeutettua paasyä.',
          [
            textContent(
              'Least Privilege in the Cloud',
              'Vahimman Oikeuden Periaate Pilvessa',
              'Most cloud incidents become worse when permissions are broad, inherited, and rarely reviewed.',
              'Useimmat pilvi-incidentit pahenevat kun oikeudet ovat liian laajat, periytyvat ja harvoin tarkistetut.',
            ),
          ],
        ),
      ],
    ),
    chapter(
      'Operational Cloud Defense',
      'Pilven Operatiivinen Puolustus',
      'Translate good cloud design into monitoring and response habits.',
      'Muunna hyva pilvisuunnittelu valvonnan ja vasteen kaytannoiksi.',
      [
        subChapter(
          'Configuration Hardening',
          'Asetusten Koventaminen',
          'Focus on storage, compute, and network defaults that often introduce exposure.',
          'Keskity tallennuksen, laskennan ja verkon oletusasetuksiin jotka usein aiheuttavat altistusta.',
          [
            textContent(
              'Safe Defaults',
              'Turvalliset Oletukset',
              'Hardening starts by removing public exposure, narrowing access, and documenting intended state.',
              'Koventaminen alkaa poistamalla julkinen altistus, rajaamalla paasy ja dokumentoimalla haluttu tila.',
            ),
          ],
        ),
        subChapter(
          'Cloud Monitoring and Response',
          'Pilven Valvonta ja Vaste',
          'Use cloud-native telemetry to detect suspicious access and risky configuration drift.',
          'Kayta pilven omaa telemetriaa havaitaksesi epailyttavan paasytoiminnan ja riskialttiin asetusmuutoksen.',
          [
            textContent(
              'Detection Priorities',
              'Havaitsemisen Prioriteetit',
              'High-value alerts often involve identity misuse, exposed storage, and unusual administrative behavior.',
              'Korkean arvon havainnot liittyvat usein identiteetin vaarinkayttoon, avoimeen tallennukseen ja poikkeavaan hallintakayttaytymiseen.',
            ),
          ],
        ),
      ],
    ),
  ];
}

function buildIncidentResponseOutline(): SeedChapterDefinition[] {
  return [
    chapter(
      'Response Preparation',
      'Vasteen Valmistelu',
      'Create the structure needed to react calmly and consistently under pressure.',
      'Rakenna valmius reagoida rauhallisesti ja johdonmukaisesti paineen alla.',
      [
        subChapter(
          'Detection and Triage',
          'Havaitseminen ja Triage',
          'Identify what happened first, what is affected, and what needs immediate containment.',
          'Tunnista ensin mita tapahtui, mika on vaikutuksen piirissa ja mita on rajattava heti.',
          [
            textContent(
              'Initial Assessment',
              'Alkuarviointi',
              'Fast triage depends on good signals, incident context, and a clear severity model.',
              'Nopea triage perustuu hyviin signaaleihin, incidentin kontekstiin ja selkeaan vakavuusmalliin.',
            ),
          ],
        ),
        subChapter(
          'Evidence Handling',
          'Todisteiden Kasittely',
          'Preserve useful evidence without contaminating the investigation.',
          'Sailyta hyodyllinen todistusaineisto ilman etta tutkimus saastuu.',
          [
            textContent(
              'Chain of Custody Basics',
              'Todisteketjun Perusteet',
              'Forensic value depends on integrity, timestamps, and clear handling records.',
              'Rikostekninen arvo riippuu eheydesta, aikaleimoista ja selkeista kasittelymerkinnosta.',
            ),
          ],
        ),
      ],
    ),
    chapter(
      'Investigation Workflow',
      'Tutkinnan Tyonkulku',
      'Move from containment into analysis, communication, and long-term improvement.',
      'Siirry rajaamisesta analyysiin, viestintaan ja pitkavlin parantamiseen.',
      [
        subChapter(
          'Investigation and Scope Expansion',
          'Tutkinta ja Laajuuden Selvitys',
          'Determine how far the incident spread and what systems need follow-up.',
          'Selvita kuinka laajalle incidentti levisi ja mitka jarjestelmat vaativat jatkotoimia.',
          [
            textContent(
              'Scope Mapping',
              'Laajuuden Kartoitus',
              'Investigators move from known indicators to timelines, touched assets, and likely attacker actions.',
              'Tutkijat etenevat tunnetuista havainnoista aikajanaan, kosketettuihin kohteisiin ja todennakoisiin hyokkaajan toimiin.',
            ),
          ],
        ),
        subChapter(
          'Recovery and Lessons Learned',
          'Palautuminen ja Opit',
          'Close the loop with recovery planning, communication, and corrective action.',
          'Sulje kokonaisuus palautumissuunnittelulla, viestinnalla ja korjaavilla toimilla.',
          [
            textContent(
              'Post-Incident Review',
              'Poikkeaman Jalkeinen Tarkistus',
              'Strong teams document root causes, control gaps, and follow-up actions while the event is still fresh.',
              'Vahvat tiimit dokumentoivat juurisyyt, kontrollipuutteet ja jatkotoimet kun tapahtuma on viela tuoreessa muistissa.',
            ),
          ],
        ),
      ],
    ),
  ];
}

function buildCryptographyOutline(): SeedChapterDefinition[] {
  return [
    chapter(
      'Cryptographic Foundations',
      'Kryptografian Perusteet',
      'Understand the goals and tradeoffs behind secure cryptographic design.',
      'Ymmarra turvallisen kryptografisen suunnittelun tavoitteet ja kompromissit.',
      [
        subChapter(
          'Confidentiality, Integrity, and Authenticity',
          'Luottamuksellisuus, Eheys ja Autenttisuus',
          'Start with the security goals cryptography is meant to protect.',
          'Aloita turvallisuustavoitteista joita kryptografialla pyritaan suojaamaan.',
          [
            textContent(
              'Security Goals in Practice',
              'Turvallisuustavoitteet Kaytannossa',
              'Choosing the right primitive depends on whether you need secrecy, tamper detection, identity assurance, or all three.',
              'Oikean primitiivin valinta riippuu siita tarvitsetko salaisuutta, manipuloinnin havaitsemista, identiteetin varmistusta vai kaikkia kolmea.',
            ),
          ],
        ),
        subChapter(
          'Symmetric vs Asymmetric Encryption',
          'Symmetrinen ja Epasymmetrinen Salaus',
          'Compare the roles, strengths, and limits of the two main encryption approaches.',
          'Vertaa kahden paamenetelman rooleja, vahvuuksia ja rajoja.',
          [
            textContent(
              'Choosing the Right Tool',
              'Oikean Tyokalun Valinta',
              'Modern systems often combine symmetric speed with asymmetric key exchange and identity trust.',
              'Modernit jarjestelmat yhdistavat usein symmetrisen nopeuden epasymmetriseen avaintenvaihtoon ja luottamukseen.',
            ),
          ],
        ),
      ],
    ),
    chapter(
      'Implementation and Operations',
      'Toteutus ja Operointi',
      'Focus on the operational details that usually decide whether crypto is actually safe.',
      'Keskity niihin operatiivisiin yksityiskohtiin jotka usein ratkaisevat onko kryptografia todella turvallinen.',
      [
        subChapter(
          'Key Management Lifecycle',
          'Avainten Hallinnan Elinkaari',
          'Generate, store, rotate, and retire keys with discipline.',
          'Luo, sailyta, kierrata ja poista avaimet kurinalaisesti.',
          [
            textContent(
              'Protecting Key Material',
              'Avainten Suojaaminen',
              'Strong encryption fails quickly when keys are exposed, copied carelessly, or never rotated.',
              'Vahva salaus menettaa arvonsa nopeasti jos avaimet paljastuvat, kopioidaan huolimattomasti tai niita ei koskaan kierrateta.',
            ),
          ],
        ),
        subChapter(
          'Common Implementation Pitfalls',
          'Yleiset Toteutusvirheet',
          'Avoid the mistakes that break secure design during real implementation.',
          'Valta virheet jotka rikkovat turvallisen suunnittelun todellisessa toteutuksessa.',
          [
            textContent(
              'Unsafe Shortcuts',
              'Turvattomat Oikopolut',
              'Bad randomness, homegrown cryptography, and insecure storage are more dangerous than weak theory alone.',
              'Huono satunnaisuus, itse kehitetty kryptografia ja turvaton tallennus ovat vaarallisempia kuin heikko teoria yksin.',
            ),
          ],
        ),
      ],
    ),
  ];
}

const courseDefinitions: SeedCourseDefinition[] = [
  {
    titleEn: 'Fundamentals of Cybersecurity',
    titleFi: 'Kyberturvallisuuden Perusteet',
    descriptionEn:
      'Learn the fundamentals of cybersecurity including threats, vulnerabilities, and defense strategies. Perfect for beginners.',
    descriptionFi:
      'Opi kyberturvallisuuden perusteet, mukaan lukien uhat, haavoittuvuudet ja puolustusstrategiat.',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 480,
    coverImage:
      'https://bis-dev.com/wp-content/uploads/2024/11/Cyber-Security.jpeg',
    outline: buildCybersecurityFundamentalsOutline(),
    author: {
      name: 'John Doe',
      roleEn: 'Cybersecurity Expert',
      roleFi: 'Kyberturvallisuuden asiantuntija',
      biographyEn:
        'John helps beginners build strong cybersecurity habits and defensive thinking.',
      biographyFi:
        'John auttaa aloittelijoita rakentamaan vahvat kyberturvallisuuden perustaidot.',
    },
  },
  {
    titleEn: 'Advanced Network Security',
    titleFi: 'Edistynyt Verkon Turvallisuus',
    descriptionEn:
      'Master advanced network security concepts including firewalls, intrusion detection, and network architecture.',
    descriptionFi:
      'Hallitse edistyneet verkkoturvallisuuden kasitteet mukaan lukien palomuurit ja hyokkaysten havaitseminen.',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 540,
    coverImage:
      'https://media.licdn.com/dms/image/v2/D5612AQFAQ49hgyWXQg/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1722706604917?e=2147483647&v=beta&t=tq8BemJRH7fjSGmdWO_krHYpBGYI5NHaEVwsYamSTrk',
    outline: buildAdvancedNetworkSecurityOutline(),
    author: {
      name: 'Jane Smith',
      roleEn: 'Network Security Specialist',
      roleFi: 'Verkon turvallisuus asiantuntija',
      biographyEn:
        'Jane focuses on secure architecture, traffic visibility, and layered controls.',
      biographyFi:
        'Jane keskittyy turvalliseen arkkitehtuuriin, liikenteen nakyvyyteen ja kerrostettuihin kontrolleihin.',
    },
  },
  {
    titleEn: 'Penetration Testing Mastery',
    titleFi: 'Penetraatiotestauksen Mestarisuus',
    descriptionEn:
      'Become an expert in penetration testing techniques, methodologies, and tools used by security professionals.',
    descriptionFi:
      'Tule asiantuntijaksi penetraatiotestauksen tekniikoissa ja menetelmissa, joita turvallisuusalan ammattilaiset kayttavat.',
    level: CourseLevel.PREMIUM,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 600,
    coverImage: 'https://img-c.udemycdn.com/course/480x270/6508453_cba3_2.jpg',
    outline: buildPenetrationTestingOutline(),
    author: {
      name: 'Alex Johnson',
      roleEn: 'Penetration Testing Expert',
      roleFi: 'Penetraatiotestaus asiantuntija',
      biographyEn:
        'Alex teaches offensive security with a strong focus on ethics and reporting quality.',
      biographyFi:
        'Alex opettaa hyokkaavaa turvallisuutta painottaen etiikkaa ja raportoinnin laatua.',
    },
  },
  {
    titleEn: 'Cloud Security Essentials',
    titleFi: 'Pilven Turvallisuuden Perusteet',
    descriptionEn:
      'Secure cloud infrastructure and applications. Learn best practices for AWS, Azure, and Google Cloud security.',
    descriptionFi:
      'Suojaa pilvi-infrastruktuuri ja sovellukset. Opi AWS:n, Azuren ja Google Cloudin turvallisuuden parhaat kaytannot.',
    level: CourseLevel.PREMIUM,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 480,
    coverImage:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR47KWFGzE37lwWnhTVvFpN86OJD1TEte4KVw&s',
    outline: buildCloudSecurityOutline(),
    author: {
      name: 'Sarah Williams',
      roleEn: 'Cloud Security Architect',
      roleFi: 'Pilvi turvallisuus arkkitehti',
      biographyEn:
        'Sarah works on secure cloud platforms, resilient deployment, and access design.',
      biographyFi:
        'Sarah tyoskentelee turvallisten pilvialustojen, kestavan julkaisemisen ja paasyhallinnan parissa.',
    },
  },
  {
    titleEn: 'Incident Response & Forensics',
    titleFi: 'Poikkeamien Hallinta ja Rikosteknologia',
    descriptionEn:
      'Learn how to respond to security incidents and conduct digital forensics investigations professionally.',
    descriptionFi:
      'Opi reagoimaan turvallisuuspoikkeamiin ja suorittamaan digitaalisen rikosteknologian tutkimuksia ammattimaisesti.',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 520,
    coverImage:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3uFAKZrTR9oN6vniePwb2gq0DC5m2SS4C0Q&s',
    outline: buildIncidentResponseOutline(),
    author: {
      name: 'Mike Brown',
      roleEn: 'Incident Response Professional',
      roleFi: 'Poikkeama hallinta ammattilainen',
      biographyEn:
        'Mike teaches calm response coordination, evidence handling, and investigative discipline.',
      biographyFi:
        'Mike opettaa rauhallista reagointia, todisteiden kasittelya ja tutkinnan kurinalaisuutta.',
    },
  },
  {
    titleEn: 'Cryptography & Encryption',
    titleFi: 'Kryptografia ja Salaus',
    descriptionEn:
      'Understand cryptographic principles, encryption algorithms, and how to secure data in transit and at rest.',
    descriptionFi:
      'Ymmarra kryptografian periaatteet, salausalgoritmit ja kuinka suojata tiedot siirtotilassa ja levossa.',
    level: CourseLevel.PREMIUM,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 450,
    coverImage:
      'https://cdn.educba.com/academy/wp-content/uploads/2018/10/Cryptography-vs-Encryption-1.png',
    outline: buildCryptographyOutline(),
    author: {
      name: 'Emily Davis',
      roleEn: 'Cryptography Specialist',
      roleFi: 'Kryptografia asiantuntija',
      biographyEn:
        'Emily connects mathematical ideas to practical implementation choices for real products.',
      biographyFi:
        'Emily yhdistaa matemaattiset ideat kaytannon toteutusvalintoihin oikeissa tuotteissa.',
    },
  },
];

export async function seedCourses(dataSource: DataSource): Promise<void> {
  const verboseLogging = process.env.SEED_VERBOSE_LOGS === 'true';

  try {
    const courseRepository = dataSource.getRepository(Course);
    const authorRepository = dataSource.getRepository(Author);
    const chapterRepository = dataSource.getRepository(Chapter);
    const subChapterRepository = dataSource.getRepository(SubChapter);
    const contentRepository = dataSource.getRepository(PedagogicalContent);

    for (const definition of courseDefinitions) {
      let author = await authorRepository.findOne({
        where: { name: definition.author.name },
      });

      if (!author) {
        author = authorRepository.create(definition.author);
      } else {
        Object.assign(author, definition.author);
      }

      author = await authorRepository.save(author);

      let course = await courseRepository.findOne({
        where: { titleEn: definition.titleEn },
        relations: ['authors'],
      });

      if (!course) {
        course = courseRepository.create({
          titleEn: definition.titleEn,
          titleFi: definition.titleFi,
          descriptionEn: definition.descriptionEn,
          descriptionFi: definition.descriptionFi,
          level: definition.level,
          status: definition.status,
          estimatedDuration: definition.estimatedDuration,
          coverImage: definition.coverImage,
        });
      } else {
        Object.assign(course, {
          titleFi: definition.titleFi,
          descriptionEn: definition.descriptionEn,
          descriptionFi: definition.descriptionFi,
          level: definition.level,
          status: definition.status,
          estimatedDuration: definition.estimatedDuration,
          coverImage: definition.coverImage,
        });
      }

      course.authors = [author];
      course = await courseRepository.save(course);

      const existingChapterCount = await chapterRepository.count({
        where: { courseId: course.id },
      });

      if (existingChapterCount > 0) {
        if (verboseLogging) {
          console.log(
            `[SEED] Course "${course.titleEn}" already has ${existingChapterCount} chapters, skipping hierarchy creation`,
          );
        }
        continue;
      }

      const chapters = definition.outline;

      if (verboseLogging) {
        console.log(`[SEED] Creating hierarchy for "${course.titleEn}"`);
      }

      for (const [chapterIndex, chapterDefinition] of chapters.entries()) {
        const chapter = await chapterRepository.save(
          chapterRepository.create({
            titleEn: chapterDefinition.titleEn,
            titleFi: chapterDefinition.titleFi,
            descriptionEn: chapterDefinition.descriptionEn,
            descriptionFi: chapterDefinition.descriptionFi,
            orderIndex: chapterIndex + 1,
            courseId: course.id,
          }),
        );

        for (const [
          subChapterIndex,
          subChapterDefinition,
        ] of chapterDefinition.subChapters.entries()) {
          const subChapter = await subChapterRepository.save(
            subChapterRepository.create({
              titleEn: subChapterDefinition.titleEn,
              titleFi: subChapterDefinition.titleFi,
              descriptionEn: subChapterDefinition.descriptionEn,
              descriptionFi: subChapterDefinition.descriptionFi,
              orderIndex: subChapterIndex + 1,
              chapterId: chapter.id,
            }),
          );

          for (const [
            contentIndex,
            contentDefinition,
          ] of subChapterDefinition.contents.entries()) {
            await contentRepository.save(
              contentRepository.create({
                titleEn: contentDefinition.titleEn,
                titleFi: contentDefinition.titleFi,
                type: contentDefinition.type,
                contentEn: contentDefinition.contentEn,
                contentFi: contentDefinition.contentFi,
                url: null,
                orderIndex: contentIndex + 1,
                subChapterId: subChapter.id,
              }),
            );
          }
        }
      }
    }

    const totalChapters = await chapterRepository.count();
    const totalSubChapters = await subChapterRepository.count();
    const totalContents = await contentRepository.count();

    console.log(
      `[SEED] Course seed complete: ${await courseRepository.count()} courses, ${totalChapters} chapters, ${totalSubChapters} sub-chapters, ${totalContents} contents`,
    );
  } catch (error) {
    console.error('[SEED] FATAL ERROR - Failed to seed courses:', error);
    throw error;
  }
}
