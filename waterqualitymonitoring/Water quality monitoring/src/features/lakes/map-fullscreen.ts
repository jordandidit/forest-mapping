/** Enter fullscreen when the map is not already the fullscreen element. */
export function fullscreenAction(
  current: EventTarget | null,
  map: EventTarget,
): 'enter' | 'exit' {
  return current === map ? 'exit' : 'enter'
}
