from app.celery_worker import celery
from app.engines import r_roc_analysis_engine, r_analysis_engine
import traceback

@celery.task(bind=True, name="app.tasks.run_analysis_task")
def run_analysis_task(self, data):
    try:
        result = r_analysis_engine.call_plot_analysis(data)
        return result
    except Exception as e:
        self.update_state(
            state="FAILURE",
            meta={
                "exc_type": type(e).__name__,
                "exc_message": str(e),
                "traceback": traceback.format_exc()
            }
        )
        raise e

@celery.task(bind=True, name="app.tasks.run_roc_analysis_task")
def run_roc_analysis_task(self, data):
    try:
        # call_roc_plot_analysis is likely blocking, which is fine inside a worker
        result = r_roc_analysis_engine.call_roc_plot_analysis(data)
        return result
    except Exception as e:
        self.update_state(
            state="FAILURE",
            meta={
                "exc_type": type(e).__name__,
                "exc_message": traceback.format_exc().split("\n")
            }
        )
        raise e
