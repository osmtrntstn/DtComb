from app.engines import r_roc_analysis_engine


async def run_analysis(data):
    return r_roc_analysis_engine.call_roc_plot_analysis(data)
