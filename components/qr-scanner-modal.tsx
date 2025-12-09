'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  description?: string;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Scan QR Code",
  description = "Position the QR code within the camera view"
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError('');
      setScanning(true);

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const videoInputDevices = await codeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      console.log('[QR SCANNER] Starting camera with device:', selectedDeviceId);

      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, err) => {
          if (result) {
            console.log('[QR SCANNER] QR Code detected:', result.getText());
            onScan(result.getText());
            stopScanning();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('[QR SCANNER] Scanning error:', err);
          }
        }
      );

    } catch (err) {
      console.error('[QR SCANNER] Error starting scanner:', err);
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      console.log('[QR SCANNER] Stopping scanner');
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>

        {/* Camera View */}
        <div className="relative bg-black aspect-square">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanning overlay */}
          {scanning && (
            <div className="absolute inset-0 border-2 border-green-400 rounded-lg m-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <p className="text-white text-sm bg-black bg-opacity-50 rounded px-2 py-1">
                  Scanning for QR code...
                </p>
              </div>
            </div>
          )}

          {/* Corner markers */}
          <div className="absolute inset-4 pointer-events-none">
            {/* Top-left */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
            {/* Top-right */}
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
            {/* Bottom-left */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
            {/* Bottom-right */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
