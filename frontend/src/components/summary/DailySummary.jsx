function formatDate(date) {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

function DailySummary({ tasks }) {

  const grouped = tasks.reduce(
    (groups, task) => {

      const key =
        new Date(
          task.createdAt
        ).toDateString();

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(task);

      return groups;

    },
    {}
  );

  return (
    <div className="daily-summary">

      <div className="daily-row header-row">

        <span>Date</span>
        <span>Total</span>
        <span>Pending</span>
        <span>Completed</span>

      </div>

      {Object.entries(grouped).map(
        ([date, dateTasks]) => {

          const total =
            dateTasks.length;

          const completed =
            dateTasks.filter(
              (task) =>
                task.completed
            ).length;

          const pending =
            total - completed;

          return (
            <div
              className="daily-row"
              key={date}
            >

              <span>
                {formatDate(
                  dateTasks[0].createdAt
                )}
              </span>

              <span>{total}</span>

              <span>{pending}</span>

              <span>{completed}</span>

            </div>
          );
        }
      )}

    </div>
  );
}

export default DailySummary;