import { Document, Page, Text, View, StyleSheet, Link, Font, renderToStream } from "@react-pdf/renderer";
import {
  PERSONAL_INFO,
  SKILLS,
  CERTIFICATIONS,
  WORK_EXPERIENCE,
  ORGANIZATIONS,
  PROJECTS,
} from "./content";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    lineHeight: 1.45,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 11,
    marginTop: 4,
    color: "#333333",
  },
  contactRow: {
    fontSize: 9.5,
    marginTop: 6,
    color: "#333333",
  },
  link: {
    color: "#1a1a1a",
    textDecoration: "none",
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: "#1a1a1a",
    borderBottomStyle: "solid",
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 4,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  entryTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
  },
  entryMeta: {
    fontSize: 9.5,
    color: "#444444",
  },
  entrySub: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#333333",
    marginBottom: 2,
  },
  bullet: {
    flexDirection: "row",
    marginTop: 2,
  },
  bulletDash: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  skillRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  skillLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    width: 80,
  },
  skillItems: {
    flex: 1,
    fontSize: 10,
  },
});

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDash}>-</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function CvDocument() {
  const pdfTitle = `${PERSONAL_INFO.name} - ${PERSONAL_INFO.title} CV`;
  const keywords = [
    PERSONAL_INFO.name,
    PERSONAL_INFO.title,
    ...SKILLS.flatMap((s) => s.items),
    ...CERTIFICATIONS.map((c) => c.title),
  ].join(", ");

  return (
    <Document
      title={pdfTitle}
      author={PERSONAL_INFO.name}
      subject={`Curriculum Vitae - ${PERSONAL_INFO.title}`}
      keywords={keywords}
      creator={PERSONAL_INFO.name}
      producer="Portfolio CV Generator"
    >
      <Page size="A4" style={styles.page} wrap>
        <View>
          <Text style={styles.name}>{PERSONAL_INFO.name}</Text>
          <Text style={styles.title}>
            {PERSONAL_INFO.title} | {PERSONAL_INFO.location}
          </Text>
          <Text style={styles.contactRow}>
            {`Email: ${PERSONAL_INFO.email}  |  GitHub: ${PERSONAL_INFO.github}  |  LinkedIn: ${PERSONAL_INFO.linkedin}`}
          </Text>
        </View>

        <Text style={styles.sectionHeader}>SUMMARY</Text>
        <Text style={styles.paragraph}>{PERSONAL_INFO.summary}</Text>

        <Text style={styles.sectionHeader}>EDUCATION</Text>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle}>{PERSONAL_INFO.education.institution}</Text>
          <Text style={styles.entryMeta}>{PERSONAL_INFO.education.period}</Text>
        </View>
        <Text style={styles.entrySub}>
          {PERSONAL_INFO.education.degree} | {PERSONAL_INFO.education.location} | GPA: {PERSONAL_INFO.education.gpa}
        </Text>
        {PERSONAL_INFO.education.highlights.map((h, i) => (
          <Bullet key={i}>{h}</Bullet>
        ))}

        <Text style={styles.sectionHeader}>EXPERIENCE</Text>
        {WORK_EXPERIENCE.map((entry) => (
          <View key={entry.company} wrap={false}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>
                {entry.role} - {entry.company}
              </Text>
              <Text style={styles.entryMeta}>{entry.period}</Text>
            </View>
            <Text style={styles.entrySub}>
              {entry.location} | {entry.description}
            </Text>
            {entry.highlights.map((h, i) => (
              <Bullet key={i}>{h}</Bullet>
            ))}
          </View>
        ))}

        <Text style={styles.sectionHeader}>SKILLS</Text>
        {SKILLS.map((category) => (
          <View key={category.label} style={styles.skillRow}>
            <Text style={styles.skillLabel}>{category.label}:</Text>
            <Text style={styles.skillItems}>{category.items.join(", ")}</Text>
          </View>
        ))}

        <Text style={styles.sectionHeader}>CERTIFICATIONS</Text>
        {CERTIFICATIONS.map((cert) => (
          <Bullet key={cert.title}>
            {cert.title} - {cert.issuer} ({cert.year})
          </Bullet>
        ))}

        <Text style={styles.sectionHeader}>ORGANIZATIONS</Text>
        {ORGANIZATIONS.map((org) => (
          <View key={org.name} wrap={false}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>
                {org.role} - {org.name}
              </Text>
              <Text style={styles.entryMeta}>{org.period}</Text>
            </View>
            <Text style={styles.entrySub}>{org.location}</Text>
            {org.highlights.map((h, i) => (
              <Bullet key={i}>{h}</Bullet>
            ))}
          </View>
        ))}

        <Text style={styles.sectionHeader}>PROJECTS</Text>
        {PROJECTS.map((project) => {
          const primaryLink = project.links[0];
          return (
            <View key={project.id} wrap={false}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>
                  {project.title} - {project.tagline}
                </Text>
                <Text style={styles.entryMeta}>{project.year}</Text>
              </View>
              <Text style={styles.paragraph}>{project.description}</Text>
              <Text style={styles.paragraph}>Tech: {project.tech.join(", ")}</Text>
              {primaryLink ? (
                <Text style={styles.paragraph}>
                  {primaryLink.label}:{" "}
                  <Link src={primaryLink.href} style={styles.link}>
                    {primaryLink.href}
                  </Link>
                </Text>
              ) : null}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export async function renderCvPdfStream() {
  return renderToStream(<CvDocument />);
}

export const CV_FILENAME = "Muhammad-Rafif-Tri-Risqullah-CV.pdf";
