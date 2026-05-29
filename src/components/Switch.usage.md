/**
 * Switch Component - Material 3 Inspired Toggle with Dual Labels
 * 
 * FEATURES:
 * • Material 3 design with smooth animations
 * • Dual labels (off/on states)
 * • Multiple size variants (sm, md, lg)
 * • Full keyboard accessibility (Space/Enter to toggle)
 * • ARIA attributes for screen readers
 * • Disabled state support
 * 
 * ══════════════════════════════════════════════════════════════════
 * USAGE 1: ROC/CE Mode Toggle (Step4Confirm.jsx)
 * ══════════════════════════════════════════════════════════════════
 * 
 * import Switch from '../../components/Switch'
 * 
 * export default function Step4Confirm({ data, update, negContext }) {
 *   const [useRoc, setUseRoc] = useState(true)
 * 
 *   const handleDateFormatChange = (isRoc) => {
 *     setUseRoc(isRoc)
 *     // ROCDateInput will use useRoc context or pass it as prop
 *   }
 * 
 *   return (
 *     <div>
 *       <h2>步驟 4：報價確認與付款</h2>
 *       
 *       <div style={{ marginBottom: 'var(--space-5)' }}>
 *         <p className="section-title">日期格式</p>
 *         <Switch
 *           checked={!useRoc}  // false = ROC, true = CE
 *           onChange={(isCE) => handleDateFormatChange(!isCE)}
 *           labelOff="民國"
 *           labelOn="西元"
 *           id="dateFormat"
 *           ariaLabel="切換日期格式"
 *           size="md"
 *         />
 *       </div>
 * 
 *       {/* Rest of form... */}
 *     </div>
 *   )
 * }
 * 
 * ══════════════════════════════════════════════════════════════════
 * USAGE 2: Archive Toggle (DashboardPage.jsx)
 * ══════════════════════════════════════════════════════════════════
 * 
 * import Switch from '../components/Switch'
 * 
 * export default function DashboardPage() {
 *   const [showArchived, setShowArchived] = useState(false)
 *   // ... other state
 * 
 *   const handleArchiveToggle = (show) => {
 *     setShowArchived(show)
 *     // Automatically refetch quotations with new filter
 *     // fetchQuotations() will use the new showArchived value
 *   }
 * 
 *   return (
 *     <div>
 *       <div className="dashboard-header">
 *         <h1>報價管理</h1>
 *         <Switch
 *           checked={showArchived}
 *           onChange={handleArchiveToggle}
 *           labelOff="隱藏已結案"
 *           labelOn="顯示已結案"
 *           id="archiveToggle"
 *           ariaLabel="切換是否顯示已結案的報價"
 *           size="md"
 *         />
 *       </div>
 * 
 *       {/* Quotations table... */}
 *     </div>
 *   )
 * }
 * 
 * ══════════════════════════════════════════════════════════════════
 * API
 * ══════════════════════════════════════════════════════════════════
 * 
 * Props:
 *   checked       {boolean}  - Current state (default: false)
 *   onChange      {function} - Callback when toggle changes: (newValue) => {}
 *   labelOff      {string}   - Label for OFF state (default: 'Off')
 *   labelOn       {string}   - Label for ON state (default: 'On')
 *   id            {string}   - HTML id for accessibility (required for labels)
 *   ariaLabel     {string}   - Aria label for screen readers
 *   disabled      {boolean}  - Disable interaction (default: false)
 *   size          {string}   - 'sm' | 'md' (default) | 'lg'
 * 
 * ══════════════════════════════════════════════════════════════════
 * DESIGN NOTES
 * ══════════════════════════════════════════════════════════════════
 * 
 * • Uses CSS variables from globals.css for theming consistency
 * • Thumb animation: 200ms ease-out for smooth visual feedback
 * • Colors:
 *   - OFF state: --color-border (grey)
 *   - ON state: --color-accent (blue)
 *   - Hover: --color-accent-hover (darker blue)
 * • Shadows: Subtle 2px shadow on thumb for depth
 * • Accessibility:
 *   - Keyboard support: Space/Enter to toggle
 *   - Focus indicator: 2px accent outline
 *   - ARIA attributes: role="switch", aria-checked
 *   - Min tap target: ~44px for mobile usability
 */
