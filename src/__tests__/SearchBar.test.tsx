import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  it('renders the search input', () => {
    render(<SearchBar value="" onChange={jest.fn()} />);
    expect(screen.getByRole('searchbox', { name: /search gifs/i })).toBeInTheDocument();
  });

  it('calls onChange with the new value when the user types', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'cats' } });
    expect(onChange).toHaveBeenCalledWith('cats');
  });

  it('shows the clear button only when value is non-empty', () => {
    const { rerender } = render(<SearchBar value="" onChange={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();

    rerender(<SearchBar value="cats" onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls onChange with empty string when the clear button is clicked', () => {
    const onChange = jest.fn();
    render(<SearchBar value="cats" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
