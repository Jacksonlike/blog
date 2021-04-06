import { Link } from 'gatsby'

import './index.scss'

export const Header = ({ title, location, rootPath }) => {
  const isRoot = location.pathname === rootPath
  return (
    isRoot && (
      <Link to={`/`} className="link">
        {title}
      </Link>
    )
  )
}
