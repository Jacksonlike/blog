import React from 'react';
import { StaticQuery, graphql, Link } from 'gatsby';
import Image from 'gatsby-image';

import './index.scss';

export const Bio = () => (
  <StaticQuery
    query={bioQuery}
    render={(data) => {
      const { author, social, introduction } = data.site.siteMetadata;
      console.log(social, '1111111111');

      return (
        <div className="bio">
          <div className="author">
            <div className="author-description">
              <Image
                className="author-image"
                fixed={data.avatar.childImageSharp.fixed}
                alt={author}
                style={{
                  borderRadius: `100%`,
                }}
              />
              <div className="author-name">
                <span className="author-name-prefix">个人博客</span>
                <Link to={'/about'} className="author-name-content">
                  <span>@{author}</span>
                </Link>
                <div className="author-introduction">{introduction}</div>
                <p className="author-socials">
                  {social.github && (
                    <a href={`https://github.com/${social.github}`}>GitHub</a>
                  )}
                  {social.zhihu && (
                    <a href={`https://www.zhihu.com/people/${social.zhihu}`}>
                      zhihu
                    </a>
                  )}
                  {social.weibo && (
                    <a href={`https://weibo.com/${social.weibo}`}>weibo</a>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }}
  />
);

const bioQuery = graphql`
  query BioQuery {
    avatar: file(absolutePath: { regex: "/avatar.png/" }) {
      childImageSharp {
        fixed(width: 72, height: 72) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        author
        introduction
        social {
          github
          zhihu
          weibo
        }
      }
    }
  }
`;

export default Bio;
