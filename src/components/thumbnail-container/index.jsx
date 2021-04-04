import { memo } from 'react';

import './index.scss'

export const ThumbnailContainer = memo(({ children }) => (
  <div className="thumbnail-container">{children}</div>
))
