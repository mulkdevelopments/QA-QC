type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg'
  stacked?: boolean
}

export default function BrandMark({ size = 'md', stacked = false }: BrandMarkProps) {
  return (
    <div className={`brand-mark ${stacked ? 'stacked' : ''} size-${size}`}>
      <img src="/logo.png" alt="Alubond Connect" className="brand-logo" />
      <div className="brand-text">
        <p className="brand">Alubond Connect</p>
      </div>
    </div>
  )
}
