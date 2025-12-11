import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './ImageTrail.css';

function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b;
}

function getLocalPointerPos(e: MouseEvent | TouchEvent, rect: DOMRect): { x: number; y: number } {
  let clientX = 0,
    clientY = 0;
  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('clientX' in e) {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function getMouseDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

class ImageItem {
  public DOM: { el: HTMLDivElement; inner: HTMLDivElement | null } = {
    el: null as unknown as HTMLDivElement,
    inner: null
  };
  public defaultStyle: gsap.TweenVars = { scale: 1, x: 0, y: 0, opacity: 0, rotation: 0 };
  public rect: DOMRect | null = null;
  public randomScale: number;
  public randomRotation: number;
  private resize!: () => void;

  constructor(DOM_el: HTMLDivElement) {
    this.DOM.el = DOM_el;
    this.DOM.inner = this.DOM.el.querySelector('.content__img-inner');
    this.randomScale = 0.8 + Math.random() * 0.6; // Random scale between 0.8 and 1.4
    this.randomRotation = (Math.random() - 0.5) * 20; // Random rotation between -10 and 10 degrees
    this.getRect();
    this.initEvents();
  }

  private initEvents() {
    this.resize = () => {
      gsap.set(this.DOM.el, this.defaultStyle);
      this.getRect();
    };
    window.addEventListener('resize', this.resize);
  }

  private getRect() {
    this.rect = this.DOM.el.getBoundingClientRect();
  }
}

class CustomImageTrailVariant {
  private container: HTMLDivElement;
  private DOM: { el: HTMLDivElement };
  private images: ImageItem[];
  private imagesTotal: number;
  private imgPosition: number;
  private zIndexVal: number;
  private activeImagesCount: number;
  private isIdle: boolean;
  private threshold: number;
  private mousePos: { x: number; y: number };
  private lastMousePos: { x: number; y: number };
  private cacheMousePos: { x: number; y: number };
  private visibleImagesCount: number;
  private visibleImagesTotal: number;
  private idleTimeout: number | null;
  private activeImages: ImageItem[];
  private lastMouseMoveTime: number;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.DOM = { el: container };
    this.images = [...container.querySelectorAll('.content__img')].map(img => new ImageItem(img as HTMLDivElement));
    this.imagesTotal = this.images.length;
    this.imgPosition = 0;
    this.zIndexVal = 1;
    this.activeImagesCount = 0;
    this.isIdle = true;
    this.threshold = 60; // Increased for more gap between images
    this.mousePos = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    this.cacheMousePos = { x: 0, y: 0 };
    this.visibleImagesCount = 0;
    this.visibleImagesTotal = 12; // Increased from 9 to 12 for longer trail
    this.idleTimeout = null;
    this.activeImages = [];
    this.lastMouseMoveTime = Date.now();

    const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mousePos = getLocalPointerPos(ev, rect);
      this.lastMouseMoveTime = Date.now();
      this.clearIdleTimeout();
      if (this.activeImages.length > 0) {
        this.startIdleTimeout();
      }
    };
    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('touchmove', handlePointerMove);

    const initRender = (ev: MouseEvent | TouchEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mousePos = getLocalPointerPos(ev, rect);
      this.cacheMousePos = { ...this.mousePos };
      requestAnimationFrame(() => this.render());
      container.removeEventListener('mousemove', initRender as EventListener);
      container.removeEventListener('touchmove', initRender as EventListener);
    };
    container.addEventListener('mousemove', initRender as EventListener);
    container.addEventListener('touchmove', initRender as EventListener);
  }

  private render() {
    const distance = getMouseDistance(this.mousePos, this.lastMousePos);
    this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.3); // Increased lerp for less lag
    this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.3);

    if (distance > this.threshold) {
      this.showNextImage();
      this.lastMousePos = { ...this.mousePos };
    }

    if (this.isIdle && this.zIndexVal !== 1) {
      this.zIndexVal = 1;
    }
    requestAnimationFrame(() => this.render());
  }

  private showNextImage() {
    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];
    ++this.visibleImagesCount;

    // Add to active images list
    if (!this.activeImages.includes(img)) {
      this.activeImages.push(img);
    }

    // Restart idle timeout since we have new active images
    this.clearIdleTimeout();
    this.startIdleTimeout();

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2,
          rotation: img.randomRotation
        },
        {
          duration: 0.6, // Slightly longer entrance animation
          ease: 'power1',
          scale: img.randomScale,
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        { scale: 1.2 }, // Removed brightness effect, just simple scale
        {
          duration: 0.6,
          ease: 'power1',
          scale: 1
        },
        0
      );

    // Only fade out when we have too many visible images
    if (this.visibleImagesCount >= this.visibleImagesTotal) {
      const lastInQueue = this.getNewPosition(this.imgPosition, this.visibleImagesTotal);
      const oldImg = this.images[lastInQueue];
      gsap.to(oldImg.DOM.el, {
        duration: 1.2, // Much longer fade out time
        ease: 'power4',
        opacity: 0,
        scale: 0.8,
        onComplete: () => {
          if (this.activeImagesCount === 0) {
            this.isIdle = true;
          }
        }
      });
    }
  }

  private onImageActivated() {
    this.activeImagesCount++;
    this.isIdle = false;
  }

  private onImageDeactivated() {
    this.activeImagesCount--;
    // Note: We don't remove from activeImages here since the slide-up animation handles cleanup
  }

  private getNewPosition(position: number, offset: number) {
    const realOffset = Math.abs(offset) % this.imagesTotal;
    if (position - realOffset >= 0) {
      return position - realOffset;
    } else {
      return this.imagesTotal - (realOffset - position);
    }
  }

  private startIdleTimeout() {
    this.clearIdleTimeout();
    this.idleTimeout = window.setTimeout(() => {
      this.checkIdleState();
    }, 100); // Check every 100ms instead of waiting 1 second
  }

  private checkIdleState() {
    const now = Date.now();
    const timeSinceLastMove = now - this.lastMouseMoveTime;

    if (timeSinceLastMove >= 1000 && this.activeImages.length > 0) {
      // Mouse has been idle for 1+ second and there are active images
      this.animateImagesSlideUp();
    } else if (this.activeImages.length > 0) {
      // Still have active images and mouse hasn't been idle long enough, check again
      this.idleTimeout = window.setTimeout(() => {
        this.checkIdleState();
      }, 100);
    }
  }

  private clearIdleTimeout() {
    if (this.idleTimeout) {
      window.clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  private animateImagesSlideUp() {
    // Find ALL currently visible images on screen (opacity > 0)
    const visibleImages = this.images.filter(img => {
      const opacity = gsap.getProperty(img.DOM.el, 'opacity');
      return opacity && Number(opacity as number) > 0;
    });

    if (visibleImages.length === 0) return;

    // Clear any pending idle timeout
    this.clearIdleTimeout();

    // Get screen center coordinates for the slide-up destination
    const screenCenterX = window.innerWidth / 2;
    const screenTopY = -300; // Above the top of the screen

    // Animate ALL visible images one by one with a slight delay between each
    visibleImages.forEach((img, index) => {
      gsap.to(img.DOM.el, {
        duration: 1.8,
        ease: 'power2.inOut',
        x: screenCenterX - (img.rect?.width ?? 280) / 2, // Center horizontally
        y: screenTopY, // Move to top of screen
        scale: 0.2, // Shrink as they move up
        rotation: 0, // Straighten out
        opacity: 0,
        delay: index * 0.15, // Stagger the animations (increased delay)
        onComplete: () => {
          // Reset the image position after animation
          gsap.set(img.DOM.el, img.defaultStyle);
        }
      });
    });

    // Reset counters and clear active images after all animations complete
    gsap.delayedCall(visibleImages.length * 0.15 + 1.8, () => {
      this.visibleImagesCount = 0;
      this.activeImagesCount = 0;
      this.activeImages = [];
      this.isIdle = true;
    });
  }
}

interface CustomImageTrailProps {
  items?: string[];
}

export default function CustomImageTrail({ items = [] }: CustomImageTrailProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    new CustomImageTrailVariant(containerRef.current);
     
  }, [items]);

  return (
    <div className="content" ref={containerRef}>
      {items.map((url, i) => (
        <div className="content__img" key={i}>
          <div className="content__img-inner" style={{ backgroundImage: `url(${url})` }} />
        </div>
      ))}
    </div>
  );
}
