function SummaryCards({ summary }) {
  return (
    <div className="summary-cards">

      <div className="summary-card">
        <strong>
          {summary.total}
        </strong>

        <span>
          Total Tasks
        </span>
      </div>

      <div className="summary-card pending">
        <strong>
          {summary.pending}
        </strong>

        <span>
          Pending
        </span>
      </div>

      <div className="summary-card completed">
        <strong>
          {summary.completed}
        </strong>

        <span>
          Completed
        </span>
      </div>

    </div>
  );
}

export default SummaryCards;