// apps/marketplace/src/marketplace/pages/DirectListingPage.tsx
// Public view of a direct animal listing with data drawer content

import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicListing, type PublicListingResponse } from "../../api/client";
import { getUserMessage } from "../../api/errors";
import { formatCents } from "../../utils/format";
import "./DirectListingPage.css";

export function DirectListingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = React.useState<PublicListingResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getPublicListing(slug);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="direct-listing-page">
        <div className="direct-listing-page__loading">
          <div className="spinner" />
          <p>Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="direct-listing-page">
        <div className="direct-listing-page__error">
          <h2>Listing Not Found</h2>
          <p>{error ? getUserMessage(error) : "This listing could not be found."}</p>
          <Link to="/animals" className="btn btn-primary">
            Browse All Listings
          </Link>
        </div>
      </div>
    );
  }

  const { listing, breeder, animal, data: animalData } = data;

  return (
    <div className="direct-listing-page">
      {/* Header */}
      <div className="direct-listing-page__header">
        <div className="container">
          <div className="direct-listing-page__breadcrumb">
            <Link to="/animals">Listings</Link>
            <span className="separator">/</span>
            <span>{listing.headline || animal.name || "Animal Listing"}</span>
          </div>

          <div className="direct-listing-page__title-section">
            <div className="direct-listing-page__title-content">
              <h1>{listing.headline || listing.title || animal.name || "Animal Listing"}</h1>
              {listing.summary && <p className="summary">{listing.summary}</p>}

              <div className="meta">
                <span className="breeder">
                  {breeder.slug ? (
                    <Link to={`/breeders/${breeder.slug}`}>{breeder.name}</Link>
                  ) : (
                    breeder.name
                  )}
                </span>
                {breeder.city && breeder.region && (
                  <span className="location">
                    {breeder.city}, {breeder.region}
                  </span>
                )}
              </div>
            </div>

            <div className="direct-listing-page__price">
              {listing.priceModel === "fixed" && listing.priceCents ? (
                <div className="price-fixed">
                  <span className="amount">{formatCents(listing.priceCents)}</span>
                </div>
              ) : listing.priceModel === "range" && listing.priceMinCents && listing.priceMaxCents ? (
                <div className="price-range">
                  <span className="amount">
                    {formatCents(listing.priceMinCents)} - {formatCents(listing.priceMaxCents)}
                  </span>
                </div>
              ) : (
                <div className="price-inquire">
                  <span className="label">Contact for Price</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container">
        <div className="direct-listing-page__content">
          {/* Main Column */}
          <div className="direct-listing-page__main">
            {/* Hero Image */}
            {animal.photoUrl && (
              <div className="direct-listing-page__hero">
                <img src={animal.photoUrl} alt={animal.name || "Animal"} />
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <section className="content-section">
                <h2>About This Listing</h2>
                <div className="content-section__body">
                  <p style={{ whiteSpace: "pre-wrap" }}>{listing.description}</p>
                </div>
              </section>
            )}

            {/* Animal Basic Info */}
            <section className="content-section">
              <h2>Animal Information</h2>
              <div className="content-section__body">
                <div className="info-grid">
                  {animal.name && (
                    <div className="info-item">
                      <span className="label">Name:</span>
                      <span className="value">{animal.name}</span>
                    </div>
                  )}
                  {animal.breed && (
                    <div className="info-item">
                      <span className="label">Breed:</span>
                      <span className="value">{animal.breed}</span>
                    </div>
                  )}
                  {animal.sex && (
                    <div className="info-item">
                      <span className="label">Sex:</span>
                      <span className="value">{animal.sex}</span>
                    </div>
                  )}
                  {animal.birthDate && (
                    <div className="info-item">
                      <span className="label">Birth Date:</span>
                      <span className="value">{new Date(animal.birthDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Registrations */}
            {animalData.registrations && animalData.registrations.length > 0 && (
              <section className="content-section">
                <h2>Registry Information</h2>
                <div className="content-section__body">
                  <div className="data-list">
                    {animalData.registrations.map((reg) => (
                      <div key={reg.id} className="data-item">
                        <span className="data-item__label">{reg.registryName}</span>
                        <span className="data-item__value">{reg.identifier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Health Testing */}
            {animalData.healthTests && animalData.healthTests.length > 0 && (
              <section className="content-section">
                <h2>Health Testing</h2>
                <div className="content-section__body">
                  <div className="data-list">
                    {animalData.healthTests.map((test) => (
                      <div key={test.id} className="data-item">
                        <span className="data-item__label">{test.displayName}</span>
                        <span className="data-item__value">{test.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Genetics */}
            {animalData.genetics && animalData.genetics.length > 0 && (
              <section className="content-section">
                <h2>Genetics</h2>
                <div className="content-section__body">
                  <div className="data-list">
                    {animalData.genetics.map((gene) => (
                      <div key={gene.id} className="data-item">
                        <span className="data-item__label">{gene.displayName}</span>
                        <span className="data-item__value">{gene.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Titles */}
            {animalData.titles && animalData.titles.length > 0 && (
              <section className="content-section">
                <h2>Titles & Achievements</h2>
                <div className="content-section__body">
                  <div className="data-list">
                    {animalData.titles.map((title) => (
                      <div key={title.id} className="data-item">
                        <span className="data-item__label">
                          {title.name} {title.abbreviation && `(${title.abbreviation})`}
                        </span>
                        {title.dateEarned && (
                          <span className="data-item__value">
                            {new Date(title.dateEarned).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Competitions */}
            {animalData.competitions && animalData.competitions.length > 0 && (
              <section className="content-section">
                <h2>Competition Results</h2>
                <div className="content-section__body">
                  <div className="data-list">
                    {animalData.competitions.map((comp) => (
                      <div key={comp.id} className="data-item">
                        <span className="data-item__label">{comp.eventName}</span>
                        <span className="data-item__value">
                          {comp.placement}
                          {comp.date && ` - ${new Date(comp.date).toLocaleDateString()}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Lineage */}
            {animalData.lineage && (animalData.lineage.sire || animalData.lineage.dam) && (
              <section className="content-section">
                <h2>Pedigree</h2>
                <div className="content-section__body">
                  <div className="lineage-grid">
                    {animalData.lineage.sire && (
                      <div className="lineage-item">
                        <h3>Sire</h3>
                        {animalData.lineage.sire.photoUrl && (
                          <img src={animalData.lineage.sire.photoUrl} alt={animalData.lineage.sire.name} />
                        )}
                        <p className="lineage-name">{animalData.lineage.sire.name}</p>
                        {animalData.lineage.sire.birthDate && (
                          <p className="lineage-dob">
                            {new Date(animalData.lineage.sire.birthDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {animalData.lineage.dam && (
                      <div className="lineage-item">
                        <h3>Dam</h3>
                        {animalData.lineage.dam.photoUrl && (
                          <img src={animalData.lineage.dam.photoUrl} alt={animalData.lineage.dam.name} />
                        )}
                        <p className="lineage-name">{animalData.lineage.dam.name}</p>
                        {animalData.lineage.dam.birthDate && (
                          <p className="lineage-dob">
                            {new Date(animalData.lineage.dam.birthDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Breeding Stats */}
            {animalData.breeding && (
              <section className="content-section">
                <h2>Breeding Information</h2>
                <div className="content-section__body">
                  <div className="info-grid">
                    {animalData.breeding.offspringCount !== undefined && (
                      <div className="info-item">
                        <span className="label">Offspring Count:</span>
                        <span className="value">{animalData.breeding.offspringCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Media Gallery */}
            {animalData.media && animalData.media.length > 0 && (
              <section className="content-section">
                <h2>Media Gallery</h2>
                <div className="content-section__body">
                  <div className="media-grid">
                    {animalData.media.map((media) => (
                      <div key={media.id} className="media-item">
                        {media.type === "image" ? (
                          <img src={media.url} alt={media.caption || "Animal media"} />
                        ) : media.type === "video" ? (
                          <video controls src={media.url} />
                        ) : null}
                        {media.caption && <p className="media-caption">{media.caption}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Documents */}
            {animalData.documents && animalData.documents.length > 0 && (
              <section className="content-section">
                <h2>Documents</h2>
                <div className="content-section__body">
                  <div className="document-list">
                    {animalData.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="document-item"
                      >
                        <span className="document-icon">📄</span>
                        <span className="document-name">{doc.filename}</span>
                        <span className="document-kind">{doc.kind}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="direct-listing-page__sidebar">
            <div className="sidebar-card">
              <h3>Contact Breeder</h3>
              <p>Interested in this listing? Contact the breeder for more information.</p>
              <button className="btn btn-primary btn-block">Send Inquiry</button>
            </div>

            {listing.locationCity && listing.locationRegion && (
              <div className="sidebar-card">
                <h3>Location</h3>
                <p>
                  {listing.locationCity}, {listing.locationRegion}
                  {listing.locationCountry && `, ${listing.locationCountry}`}
                </p>
              </div>
            )}

            <div className="sidebar-card">
              <h3>About {breeder.name}</h3>
              {breeder.slug ? (
                <Link to={`/breeders/${breeder.slug}`} className="btn btn-secondary btn-block">
                  View Breeder Profile
                </Link>
              ) : (
                <p>{breeder.city && breeder.region ? `${breeder.city}, ${breeder.region}` : breeder.name}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
