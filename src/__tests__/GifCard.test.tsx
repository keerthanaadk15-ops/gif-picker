import { render, screen, fireEvent } from '@testing-library/react';
import { GifCard } from '@/components/GifCard';
import type { GiphyGif } from '@/types/giphy';

const mockGif: GiphyGif = {
  type: 'gif',
  id: 'abc123',
  title: 'Funny Cat GIF',
  url: 'https://giphy.com/gifs/abc123',
  embed_url: 'https://giphy.com/embed/abc123',
  images: {
    original: {
      url: 'https://media.giphy.com/abc123/giphy.gif',
      mp4: 'https://media.giphy.com/abc123/giphy.mp4',
      width: '480',
      height: '270',
    },
    original_mp4: {
      mp4: 'https://media.giphy.com/abc123/giphy.mp4',
      mp4_size: '500000',
      width: '480',
      height: '270',
    },
    fixed_height: {
      url: 'https://media.giphy.com/abc123/200.gif',
      mp4: 'https://media.giphy.com/abc123/200.mp4',
      width: '356',
      height: '200',
    },
    downsized: {
      url: 'https://media.giphy.com/abc123/giphy-downsized.gif',
      mp4: '',
      width: '320',
      height: '180',
    },
  },
};

describe('GifCard', () => {
  it('renders a video element with the MP4 source', () => {
    const { container } = render(<GifCard gif={mockGif} onCopy={jest.fn()} />);
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video.tagName).toBe('VIDEO');
    expect(video.src).toContain('giphy.mp4');
    expect(video.autoplay).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.muted).toBe(true);
  });

  it('renders the GIF title', () => {
    render(<GifCard gif={mockGif} onCopy={jest.fn()} />);
    expect(screen.getByText('Funny Cat GIF')).toBeInTheDocument();
  });

  it('calls onCopy with the original GIF URL when copy button is clicked', () => {
    const onCopy = jest.fn();
    render(<GifCard gif={mockGif} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: /copy gif url/i }));
    expect(onCopy).toHaveBeenCalledWith('https://media.giphy.com/abc123/giphy.gif');
  });
});
