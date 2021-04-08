import { Link } from 'gatsby'
import { TARGET_CLASS } from '../../utils/visible'

import './index.scss'

export function formatReadingTime(minutes) {
  let cups = Math.round(minutes / 5)
  if (cups > 4) {
    return `${new Array(Math.round(cups / 4))
      .fill('🍚')
      .join('')} 阅读需要 ${minutes} 分钟`
  } else {
    return `${new Array(cups || 1)
      .fill('🍵')
      .join('')} 阅读需要 ${minutes} 分钟`
  }
}

export const ThumbnailItem = ({ node }) => (
  <Link className={`thumbnail ${TARGET_CLASS}`} to={node.fields.slug}>
    <div key={node.fields.slug}>
      <header>
        <h3>{node.frontmatter.title || node.fields.slug}</h3>
        <small>
          {node.frontmatter.date}
          {` • ${formatReadingTime(node.timeToRead)}`}
        </small>
      </header>
      <p dangerouslySetInnerHTML={{ __html: node.excerpt }} />
    </div>
  </Link>
)
