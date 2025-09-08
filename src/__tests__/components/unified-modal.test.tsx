/**
 * Tests para el componente UnifiedModal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnifiedModal } from '@/components/ui/unified-modal';

// Mock framer-motion para evitar problemas en tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('UnifiedModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.body.style
    Object.defineProperty(document.body, 'style', {
      value: { overflow: '' },
      writable: true,
    });
  });

  it('debería renderizar cuando open es true', () => {
    render(<UnifiedModal {...defaultProps} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('no debería renderizar cuando open es false', () => {
    render(<UnifiedModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('debería mostrar el título cuando se proporciona', () => {
    render(<UnifiedModal {...defaultProps} title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('debería mostrar la descripción cuando se proporciona', () => {
    render(
      <UnifiedModal {...defaultProps} title="Test Title" description="Test Description" />
    );
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('debería mostrar el botón de cerrar por defecto', () => {
    render(<UnifiedModal {...defaultProps} title="Test Title" />);
    const closeButton = screen.getByLabelText('Cerrar modal');
    expect(closeButton).toBeInTheDocument();
  });

  it('no debería mostrar el botón de cerrar cuando showCloseButton es false', () => {
    render(
      <UnifiedModal {...defaultProps} title="Test Title" showCloseButton={false} />
    );
    const closeButton = screen.queryByLabelText('Cerrar modal');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('debería llamar onOpenChange al hacer click en el botón de cerrar', () => {
    const onOpenChange = jest.fn();
    render(
      <UnifiedModal {...defaultProps} title="Test Title" onOpenChange={onOpenChange} />
    );
    
    const closeButton = screen.getByLabelText('Cerrar modal');
    fireEvent.click(closeButton);
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('debería llamar onClose cuando se proporciona', () => {
    const onClose = jest.fn();
    render(
      <UnifiedModal {...defaultProps} title="Test Title" onClose={onClose} />
    );
    
    const closeButton = screen.getByLabelText('Cerrar modal');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('debería cerrar al hacer click en el backdrop cuando closeOnBackdropClick es true', () => {
    const onOpenChange = jest.fn();
    render(
      <UnifiedModal 
        {...defaultProps} 
        onOpenChange={onOpenChange} 
        closeOnBackdropClick={true} 
      />
    );
    
    // El backdrop es el primer div con la clase fixed
    const backdrop = document.querySelector('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it('no debería cerrar al hacer click en el backdrop cuando closeOnBackdropClick es false', () => {
    const onOpenChange = jest.fn();
    render(
      <UnifiedModal 
        {...defaultProps} 
        onOpenChange={onOpenChange} 
        closeOnBackdropClick={false} 
      />
    );
    
    const backdrop = document.querySelector('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onOpenChange).not.toHaveBeenCalled();
    }
  });

  it('debería cerrar al presionar Escape cuando closeOnEscape es true', () => {
    const onOpenChange = jest.fn();
    render(
      <UnifiedModal 
        {...defaultProps} 
        onOpenChange={onOpenChange} 
        closeOnEscape={true} 
      />
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('debería aplicar la clase de tamaño correcta', () => {
    const { rerender } = render(<UnifiedModal {...defaultProps} size="sm" />);
    expect(document.querySelector('.max-w-sm')).toBeInTheDocument();

    rerender(<UnifiedModal {...defaultProps} size="lg" />);
    expect(document.querySelector('.max-w-lg')).toBeInTheDocument();

    rerender(<UnifiedModal {...defaultProps} size="xl" />);
    expect(document.querySelector('.max-w-xl')).toBeInTheDocument();

    rerender(<UnifiedModal {...defaultProps} size="full" />);
    expect(document.querySelector('.max-w-\\[95vw\\]')).toBeInTheDocument();
  });

  it('debería prevenir el scroll del body cuando está abierto', () => {
    render(<UnifiedModal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('debería restaurar el scroll del body cuando se cierra', () => {
    const { unmount } = render(<UnifiedModal {...defaultProps} />);
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('debería aplicar className personalizada', () => {
    render(<UnifiedModal {...defaultProps} className="custom-class" />);
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });
});

describe('Componentes auxiliares de UnifiedModal', () => {
  it('ModalHeader debería renderizar correctamente', () => {
    const { ModalHeader } = require('@/components/ui/unified-modal');
    render(<ModalHeader>Header Content</ModalHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('ModalTitle debería renderizar correctamente', () => {
    const { ModalTitle } = require('@/components/ui/unified-modal');
    render(<ModalTitle>Title Content</ModalTitle>);
    expect(screen.getByText('Title Content')).toBeInTheDocument();
  });

  it('ModalDescription debería renderizar correctamente', () => {
    const { ModalDescription } = require('@/components/ui/unified-modal');
    render(<ModalDescription>Description Content</ModalDescription>);
    expect(screen.getByText('Description Content')).toBeInTheDocument();
  });

  it('ModalContent debería renderizar correctamente', () => {
    const { ModalContent } = require('@/components/ui/unified-modal');
    render(<ModalContent>Content</ModalContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('ModalFooter debería renderizar correctamente', () => {
    const { ModalFooter } = require('@/components/ui/unified-modal');
    render(<ModalFooter>Footer Content</ModalFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });
});
