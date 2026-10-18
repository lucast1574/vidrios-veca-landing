import React from "react";
import {
  CATEGORIES,
  type ProjectInput,
  type RichNode,
  type Media,
} from "@veca/content";

export function RichContent({
  node,
  images,
  path = "body",
}: {
  node: RichNode;
  images: Media[];
  path?: string;
}) {
  const children = node.content?.map((child, i) => (
    <RichContent
      key={`${path}-${i}`}
      node={child}
      images={images}
      path={`${path}-${i}`}
    />
  ));
  if (node.type === "text") {
    let output: React.ReactNode = node.text;
    for (const mark of node.marks || []) {
      if (mark.type === "bold") output = <strong>{output}</strong>;
      if (mark.type === "italic") output = <em>{output}</em>;
      if (mark.type === "underline") output = <u>{output}</u>;
      if (mark.type === "strike") output = <s>{output}</s>;
      if (mark.type === "code") output = <code>{output}</code>;
      if (
        mark.type === "link" &&
        /^https?:\/\//i.test(String(mark.attrs?.href))
      )
        output = (
          <a href={String(mark.attrs?.href)} rel="noopener noreferrer">
            {output}
          </a>
        );
    }
    return <>{output}</>;
  }
  const align = ["left", "center", "right", "justify"].includes(
    String(node.attrs?.textAlign),
  )
    ? (node.attrs?.textAlign as React.CSSProperties["textAlign"])
    : undefined;
  if (node.type === "image") {
    const image = images.find((i) => i.id === node.attrs?.mediaId);
    if (!image) return null;
    const layout = ["left", "right", "wide"].includes(
      String(node.attrs?.layout),
    )
      ? String(node.attrs?.layout)
      : "wide";
    return (
      <figure className={`article-inline-image image-${layout}`}>
        <img
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          style={{ objectPosition: `${image.positionX}% ${image.positionY}%` }}
        />
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>
    );
  }
  switch (node.type) {
    case "paragraph":
      return <p style={{ textAlign: align }}>{children}</p>;
    case "heading":
      return node.attrs?.level === 3 ? (
        <h3 style={{ textAlign: align }}>{children}</h3>
      ) : (
        <h2 style={{ textAlign: align }}>{children}</h2>
      );
    case "bulletList":
      return <ul>{children}</ul>;
    case "orderedList":
      return <ol>{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote>{children}</blockquote>;
    case "hardBreak":
      return <br />;
    case "horizontalRule":
      return <hr />;
    default:
      return <>{children}</>;
  }
}
export function ProjectArticle({ project }: { project: ProjectInput }) {
  const structured = project.pageLayout && project.pageLayout !== "legacy";
  const cover =
    !structured && project.images.find((i) => i.id === project.coverId);
  return (
    <article className="veca-article">
      <header
        className={`article-hero cover-${structured ? "top" : project.coverLayout}`}
      >
        <div className="article-heading">
          <p className="article-eyebrow">
            {CATEGORIES.find((c) => c.id === project.category)?.name} ·{" "}
            {project.location || "Lima"}
          </p>
          <h1>{project.title || "El título de tu próximo proyecto"}</h1>
          {project.excerpt && (
            <p className="article-excerpt">{project.excerpt}</p>
          )}
          <div className="article-tags">
            {project.tags.map((tag) => (
              <a
                key={tag}
                href={`https://veca.com.pe/proyectos/?${new URLSearchParams({ tag })}`}
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
        {cover && (
          <figure className="article-cover">
            <img
              src={cover.url}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              style={{
                objectPosition: `${cover.positionX}% ${cover.positionY}%`,
              }}
            />
            {cover.caption && <figcaption>{cover.caption}</figcaption>}
          </figure>
        )}
      </header>
      {structured ? (
        <div className={`article-sections layout-${project.pageLayout}`}>
          {(project.sections || []).map((section, index) => {
            const photos = section.imageIds
              .map((id) => project.images.find((image) => image.id === id))
              .filter((image): image is Media => !!image);
            const imageLeft =
              project.pageLayout === "alternating-left"
                ? index % 2 === 0
                : index % 2 !== 0;
            return (
              <section
                key={section.id}
                className={`article-story-section ${imageLeft ? "photos-left" : "photos-right"} ${photos.length ? "" : "section-text-only"}`}
              >
                {!!photos.length && (
                  <div
                    className={`article-collage collage-${Math.min(photos.length, 4)}`}
                  >
                    {photos.map((image) => (
                      <figure key={image.id}>
                        <img
                          src={image.url}
                          alt={image.alt}
                          width={image.width}
                          height={image.height}
                          loading="lazy"
                          style={{
                            objectPosition: `${image.positionX}% ${image.positionY}%`,
                          }}
                        />
                        {image.caption && (
                          <figcaption>{image.caption}</figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
                <div className="article-prose section-prose">
                  <span className="article-section-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title && <h2>{section.title}</h2>}
                  <RichContent
                    node={section.body}
                    images={project.images}
                    path={section.id}
                  />
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="article-prose">
          <RichContent node={project.body} images={project.images} />
        </div>
      )}
    </article>
  );
}

export { ProjectSolutionCard } from "./ProjectSolutionCard";
