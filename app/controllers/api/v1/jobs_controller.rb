# frozen_string_literal: true

class Api::V1::JobsController < Api::BaseController
  include Authorization

  before_action -> { authorize_if_got_token! :read, :'read:jobs' }, except: [:create, :update, :destroy, :save_job, :unsave_job, :created_jobs]
  before_action -> { doorkeeper_authorize! :write, :'write:jobs' }, only: [:create, :update, :destroy, :save_job, :unsave_job]
  before_action :require_user!, except: [:index, :show]
  before_action :set_job, only: [:show, :update, :destroy, :save_job, :unsave_job]
  before_action :check_job_ownership, only: [:update, :destroy]
  before_action :check_can_post_job, only: [:create]
  before_action :check_can_save_job, only: [:save_job, :unsave_job]

  def index
    @jobs = filtered_jobs.page(params[:page]).per(15)
    render json: @jobs, each_serializer: REST::JobSerializer
  end

  def show
    @job.increment_views! unless current_user&.id == @job.user_id
    render json: @job, serializer: REST::JobSerializer::Detailed
  end

  def create
    @job = Job.new(job_params)
    @job.user = current_user
    @job.organization = current_user.organization

    render json: @job, serializer: REST::JobSerializer::Detailed, status: 201
  end

  def update
    if @job.update(job_params)
      render json: @job, serializer: REST::JobSerializer::Detailed
    else
      render json: { error: @job.errors.full_messages.join(', ') }, status: 422
    end
  end

  def destroy
    if @job.destroy
      render json: { success: true }, status: 200
    else
      render json: { error: @job.errors.full_messages.join(', ') }, status: 422
    end
  end


  private

  def set_job
    @job = Job.find(params[:id])
  end

  def job_params
    params.permit(:title, :description, :requirements, :location,
                  :salary_range, :deadline, :status, :job_type, :contact_email, :job_category)
  end

  def check_can_save_job
    render json: { error: I18n.t('jobs.errors.cannot_save') }, status: 403 unless current_user.can_seek_job?
  end
end
