import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'GreenAlert';

export default function SEO({ title, description, image }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Environmental Reporting & Monitoring`;
  const desc = description || 'Report environmental issues in your area, track real-time resolution, and earn rewards. GreenAlert connects citizens, agencies, and administrators for a cleaner, safer environment.';
  const ogImage = image || '/GreenAlert Logo.png';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
