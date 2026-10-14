export default function Card({ children, className = '', padding = true, as: Tag = 'div', ...props }) {
  return (
    <Tag className={`surface ${padding ? 'p-4 md:p-5' : ''} ${className}`} {...props}>
      {children}
    </Tag>
  )
}
