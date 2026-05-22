'use client';

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import styles from '../CertificateSignersPage.module.css';

type SignaturePadProps = {
  clearLabel: string;
  value: string;
  onChange: (value: string) => void;
};

const CANVAS_HEIGHT = 180;

export default function SignaturePad({
  clearLabel,
  value,
  onChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const syncCanvasSize = () => {
      const context = canvas.getContext('2d');

      if (!context) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;

      canvas.width = Math.max(Math.round(rect.width * ratio), 1);
      canvas.height = Math.round(CANVAS_HEIGHT * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 2.6;
      context.strokeStyle = '#18243b';
      context.clearRect(0, 0, rect.width, CANVAS_HEIGHT);

      if (!value) {
        return;
      }

      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, rect.width, CANVAS_HEIGHT);
        context.drawImage(image, 0, 0, rect.width, CANVAS_HEIGHT);
      };
      image.src = value;
    };

    syncCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
    });

    resizeObserver.observe(canvas);
    window.addEventListener('resize', syncCanvasSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [value]);

  const getCoordinates = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const beginStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const point = getCoordinates(event);

    if (!canvas || !context || !point) {
      return;
    }

    event.preventDefault();
    isDrawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const continueStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext('2d');
    const point = getCoordinates(event);

    if (!isDrawingRef.current || !context || !point) {
      return;
    }

    event.preventDefault();
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const endStroke = () => {
    const canvas = canvasRef.current;

    if (!canvas || !isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    onChange(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, CANVAS_HEIGHT);
    onChange('');
  };

  return (
    <div className={styles.signaturePadWrap}>
      <canvas
        ref={canvasRef}
        className={styles.signaturePad}
        height={CANVAS_HEIGHT}
        onPointerDown={beginStroke}
        onPointerMove={continueStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      />
      <button
        type="button"
        className={styles.secondaryAction}
        onClick={clearSignature}
      >
        {clearLabel}
      </button>
    </div>
  );
}
