import Image from 'next/image';

export function Logo(props: React.ComponentPropsWithoutRef<'div'>) {
    return (
      <div {...props} style={{ display: 'flex', alignItems: 'center', ...props.style }}>
        <Image 
          src="/ek-logo.jpg" 
          alt="EK Logo" 
          width={40} 
          height={10}
          style={{ objectFit: 'contain', borderRadius: '100%' }}
        />
      </div>
    );
  }