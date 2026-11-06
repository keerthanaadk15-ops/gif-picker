import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => jest.clearAllTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 400));
    expect(result.current).toBe('hello');
  });

  it('does NOT update before the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'h' } }
    );

    rerender({ value: 'he' });
    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('h');
  });

  it('updates after the full delay', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'h' } }
    );

    rerender({ value: 'hello' });
    act(() => { jest.advanceTimersByTime(400); });
    expect(result.current).toBe('hello');
  });

  it('resets the timer if the value changes mid-delay', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'ab' });
    act(() => { jest.advanceTimersByTime(200); });
    rerender({ value: 'abc' });
    act(() => { jest.advanceTimersByTime(200); });
    // Only 200ms since last change – still shouldn't have updated
    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('abc');
  });
});
