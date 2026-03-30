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
  themeEn: string;
  themeFi: string;
  learningFocusEn: string;
  learningFocusFi: string;
  author: {
    name: string;
    roleEn: string;
    roleFi: string;
    biographyEn: string;
    biographyFi: string;
  };
}

function buildCourseOutline(
  themeEn: string,
  themeFi: string,
  learningFocusEn: string,
  learningFocusFi: string,
): SeedChapterDefinition[] {
  return [
    {
      titleEn: 'Foundations',
      titleFi: 'Perusteet',
      descriptionEn: `Build the core concepts behind ${themeEn}.`,
      descriptionFi: `Rakenna ${themeFi} keskeiset perusteet.`,
      subChapters: [
        {
          titleEn: 'Key Concepts',
          titleFi: 'Keskeiset Kasitteet',
          descriptionEn: `Understand the language, scope, and objectives of ${themeEn}.`,
          descriptionFi: `Ymmarra ${themeFi} kieli, laajuus ja tavoitteet.`,
          contents: [
            {
              titleEn: 'Core Ideas',
              titleFi: 'Ydinideat',
              type: ContentType.TEXT,
              contentEn: `This lesson introduces the core ideas behind ${themeEn} and explains why ${learningFocusEn} matters in practice.`,
              contentFi: `Tama osio esittelee ${themeFi} ydinideat ja selittaa miksi ${learningFocusFi} on tarkeaa kaytannossa.`,
            },
            {
              titleEn: 'Common Risks',
              titleFi: 'Yleiset Riskit',
              type: ContentType.TEXT,
              contentEn: `Teams often struggle with visibility, prioritization, and repeatable process when working on ${themeEn}.`,
              contentFi: `Tiimit kamppailevat usein nakyvyyden, priorisoinnin ja toistettavan prosessin kanssa aiheessa ${themeFi}.`,
            },
          ],
        },
        {
          titleEn: 'Working Model',
          titleFi: 'Toimintamalli',
          descriptionEn: `Learn the baseline workflow used to approach ${themeEn}.`,
          descriptionFi: `Opi perustason tyonkulku aiheen ${themeFi} kasittelyyn.`,
          contents: [
            {
              titleEn: 'Baseline Workflow',
              titleFi: 'Perustason Tyonkulku',
              type: ContentType.TEXT,
              contentEn: `A strong workflow for ${themeEn} starts with scope, simple controls, measurement, and regular review.`,
              contentFi: `Hyva tyonkulku aiheessa ${themeFi} alkaa rajauksesta, selkeista kontrolleista, mittaamisesta ja saannollisesta tarkastelusta.`,
            },
          ],
        },
      ],
    },
    {
      titleEn: 'Applied Practice',
      titleFi: 'Kaytannon Toteutus',
      descriptionEn: `Apply ${themeEn} in realistic learning scenarios.`,
      descriptionFi: `Sovella ${themeFi} realistisiin oppimistilanteisiin.`,
      subChapters: [
        {
          titleEn: 'Practical Scenarios',
          titleFi: 'Kaytannon Skenaariot',
          descriptionEn: `Use examples to connect theory and execution.`,
          descriptionFi: `Yhdista teoria ja toteutus esimerkkien avulla.`,
          contents: [
            {
              titleEn: 'Scenario Walkthrough',
              titleFi: 'Skenaarion Lapikaynti',
              type: ContentType.TEXT,
              contentEn: `This walkthrough shows how ${learningFocusEn} appears in day-to-day work and how to react with clarity.`,
              contentFi: `Tama lapikaynti nayttaa miten ${learningFocusFi} nakyy paivittaisessa tyossa ja miten siihen reagoidaan selkeasti.`,
            },
            {
              titleEn: 'Decision Checklist',
              titleFi: 'Paatoslista',
              type: ContentType.TEXT,
              contentEn: `Use a simple checklist: verify context, confirm impact, protect critical assets, and document every change.`,
              contentFi: `Kayta yksinkertaista listaa: vahvista konteksti, arvioi vaikutus, suojaa kriittiset kohteet ja dokumentoi jokainen muutos.`,
            },
          ],
        },
        {
          titleEn: 'Review and Next Steps',
          titleFi: 'Kertaus ja Seuraavat Askeleet',
          descriptionEn: `Consolidate what matters most before moving on.`,
          descriptionFi: `Vahvista tarkeimmat asiat ennen etenemista.`,
          contents: [
            {
              titleEn: 'Summary',
              titleFi: 'Yhteenveto',
              type: ContentType.TEXT,
              contentEn: `${themeEn} becomes much easier when teams use repeatable habits, shared vocabulary, and simple review loops.`,
              contentFi: `${themeFi} muuttuu selkeammaksi kun tiimit kayttavat toistettavia tapoja, yhteista sanastoa ja yksinkertaista seurantaa.`,
            },
          ],
        },
      ],
    },
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
    themeEn: 'cybersecurity fundamentals',
    themeFi: 'kyberturvallisuuden perusteet',
    learningFocusEn: 'threats, vulnerabilities, and defense strategy',
    learningFocusFi: 'uhat, haavoittuvuudet ja puolustusstrategia',
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
    themeEn: 'advanced network security',
    themeFi: 'edistynyt verkon turvallisuus',
    learningFocusEn: 'segmentation, detection, and traffic control',
    learningFocusFi: 'segmentointi, havaitseminen ja liikenteen hallinta',
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
    themeEn: 'penetration testing',
    themeFi: 'penetraatiotestaus',
    learningFocusEn: 'scope, reconnaissance, validation, and reporting',
    learningFocusFi: 'rajaus, tiedustelu, vahvistus ja raportointi',
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
    themeEn: 'cloud security',
    themeFi: 'pilviturvallisuus',
    learningFocusEn: 'identity, configuration, and cloud detection',
    learningFocusFi: 'identiteetti, asetukset ja pilvihavainnointi',
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
    themeEn: 'incident response and forensics',
    themeFi: 'poikkeamien hallinta ja rikosteknologia',
    learningFocusEn: 'coordination, evidence handling, and investigation flow',
    learningFocusFi: 'koordinointi, todisteiden kasittely ja tutkinnan kulku',
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
    themeEn: 'cryptography and encryption',
    themeFi: 'kryptografia ja salaus',
    learningFocusEn: 'security goals, key management, and safe implementation',
    learningFocusFi:
      'turvallisuustavoitteet, avainten hallinta ja turvallinen toteutus',
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

      const chapters = buildCourseOutline(
        definition.themeEn,
        definition.themeFi,
        definition.learningFocusEn,
        definition.learningFocusFi,
      );

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
