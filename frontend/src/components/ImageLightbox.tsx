type ImageLightboxProps = {
  alt?: string
  src: string
  onClose: () => void
}

export function ImageLightbox({ alt = 'Preview image', src, onClose }: ImageLightboxProps) {
  return (
    <div className="image-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="image-lightbox-close" aria-label="Close image preview" onClick={onClose}>
        <span aria-hidden="true">×</span>
      </button>
      <img src={src} alt={alt} onClick={(event) => event.stopPropagation()} />
    </div>
  )
}
