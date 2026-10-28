import { WindowProps } from '@/types'

function Icon(props: { window: WindowProps }) {
  return (
    <li className="icon-cell">
      <button type="button" className="iconWrapper unstyledButton" onClick={() => props.window.openOrFocus()}>
        <img src={props.window.xpIcon} alt="" className="pointer-events-none icon" />
        <span className="caption">{props.window.caption}</span>
      </button>
    </li>
  )
}

export default Icon
