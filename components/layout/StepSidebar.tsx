interface Step {
  number: number;
  label: string;
  status: 'active' | 'done' | 'pending';
}

const STEPS: Step[] = [
  { number: 1, label: 'Story & Script', status: 'pending' },
  { number: 2, label: 'Asset Studio', status: 'pending' },
  { number: 3, label: 'Panel Builder', status: 'pending' },
  { number: 4, label: 'Publish', status: 'pending' },
];

interface StepSidebarProps {
  currentStep: 1 | 2 | 3 | 4;
}

export default function StepSidebar({ currentStep }: StepSidebarProps) {
  const steps = STEPS.map((step) => ({
    ...step,
    status:
      step.number < currentStep
        ? 'done'
        : step.number === currentStep
        ? 'active'
        : 'pending',
  })) as Step[];

  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '3px solid var(--ink)',
        background: 'white',
        padding: '2rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-tag)',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          color: 'var(--midgray)',
          marginBottom: '1rem',
        }}
      >
        PROGRESS
      </h3>

      {steps.map((step, idx) => (
        <div key={step.number}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
            {/* Circle */}
            <div
              className={`step-circle ${step.status}`}
              style={{
                background:
                  step.status === 'active'
                    ? 'var(--accent)'
                    : step.status === 'done'
                    ? 'var(--ink)'
                    : 'white',
                color:
                  step.status === 'pending' ? 'var(--midgray)' : 'white',
                borderColor:
                  step.status === 'pending' ? 'var(--gray)' : undefined,
              }}
            >
              {step.status === 'done' ? '✓' : step.number}
            </div>

            {/* Label */}
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: step.status === 'active' ? 700 : 400,
                color:
                  step.status === 'pending'
                    ? 'var(--midgray)'
                    : 'var(--ink)',
              }}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {idx < steps.length - 1 && (
            <div
              style={{
                marginLeft: '0.9rem',
                width: '2px',
                height: '1.5rem',
                background: step.status === 'done' ? 'var(--ink)' : 'var(--gray)',
              }}
            />
          )}
        </div>
      ))}
    </aside>
  );
}
