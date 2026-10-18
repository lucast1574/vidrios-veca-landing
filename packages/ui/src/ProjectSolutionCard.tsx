import { Icon } from "./Icon";
import React from "react";
import { SOLUTION_SLOTS, type ProjectInput } from "@veca/content";
export function ProjectSolutionCard({
  project,
  href,
}: {
  project: ProjectInput;
  href?: string;
}) {
  const image = project.images.find((image) => image.id === project.coverId);
  return (
    <div className="veca-solution-card">
      <div className="solution-card-photo">
        {image && (
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
        )}
        <span>{project.location || "Lima"} · Proyecto VECA</span>
      </div>
      <div className="solution-card-copy">
        <span>
          {
            SOLUTION_SLOTS.find((slot) => slot.id === project.solutionSlot)
              ?.name
          }
        </span>
        <h3>{project.title}</h3>
        <p>{project.excerpt}</p>
        <ul>
          {project.tags.slice(0, 3).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        {href ? (
          <a href={href}>
            Ver proyecto completo{" "}
            <span aria-hidden="true">
              <Icon name="arrow-up-right" />
            </span>
          </a>
        ) : (
          <span className="solution-card-action">
            Ver proyecto completo{" "}
            <span aria-hidden="true">
              <Icon name="arrow-up-right" />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
