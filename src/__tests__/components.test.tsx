import { render, screen, fireEvent } from '@testing-library/react';
import { GifGrid } from '@/components/GifGrid';
import { Pagination } from '@/components/Pagination';
import { CopyAlert } from '@/components/CopyAlert';
import { ApiLimitBanner } from '@/components/ApiLimitBanner';
import type { GiphyGif } from '@/types/giphy';

const gif = (id: string): GiphyGif => ({
  type: 'gif', id, title: `GIF ${id}`, url: `https://giphy.com/${id}`, embed_url: '',
  images: {
    original: { url: `https://media.giphy.com/${id}.gif`, mp4: `https://media.giphy.com/${id}.mp4`, width: '1', height: '1' },
    original_mp4: { mp4: `https://media.giphy.com/${id}.mp4`, mp4_size: '1', width: '1', height: '1' },
    fixed_height: { url: '', mp4: '', width: '1', height: '1' },
    downsized: { url: '', mp4: '', width: '1', height: '1' },
  },
});

describe('GifGrid', () => {
  it('shows 12 skeletons while loading', () => {
    const { container } = render(<GifGrid gifs={[]} state="loading" onCopy={jest.fn()} />);
    expect(container.querySelectorAll('.gif-card--skeleton')).toHaveLength(12);
  });

  it('shows an error alert', () => {
    render(<GifGrid gifs={[]} state="error" onCopy={jest.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows an empty message when there are no results', () => {
    render(<GifGrid gifs={[]} state="success" onCopy={jest.fn()} />);
    expect(screen.getByText(/no gifs found/i)).toBeInTheDocument();
  });

  it('explains when rate-limited with nothing cached', () => {
    render(<GifGrid gifs={[]} state="rate-limited" onCopy={jest.fn()} />);
    expect(screen.getByText(/no cached results/i)).toBeInTheDocument();
  });

  it('renders cards and a trending label', () => {
    render(<GifGrid gifs={[gif('a'), gif('b'), gif('c')]} state="success" onCopy={jest.fn()} isTrending />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText(/trending/i)).toBeInTheDocument();
  });

  it('keeps showing cached GIFs when rate-limited', () => {
    render(<GifGrid gifs={[gif('a')]} state="rate-limited" onCopy={jest.fn()} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={0} totalPages={1} onPageChange={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables Prev on the first page and navigates forward', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={0} totalPages={3} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('disables Next on the last page and navigates back', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

describe('CopyAlert', () => {
  it('toggles the visible class', () => {
    const { rerender } = render(<CopyAlert visible={false} />);
    expect(screen.getByRole('status')).not.toHaveClass('copy-alert--visible');
    rerender(<CopyAlert visible />);
    expect(screen.getByRole('status')).toHaveClass('copy-alert--visible');
  });
});

describe('ApiLimitBanner', () => {
  it('announces the limit as an alert', () => {
    render(<ApiLimitBanner />);
    expect(screen.getByRole('alert')).toHaveTextContent(/api limit reached/i);
  });
});
